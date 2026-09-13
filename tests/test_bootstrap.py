"""Offline tests only: GitHub CLI is mocked and Git pushes into a local bare repo."""
from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
MOCK_GH = r'''#!/usr/bin/env python3
import json, os, subprocess, sys
from pathlib import Path
args = sys.argv[1:]
mode = os.environ.get('MOCK_MODE', 'success')
with open(os.environ['MOCK_LOG'], 'a') as f:
    f.write(json.dumps(args) + '\n')
if args[:2] == ['auth', 'status']:
    sys.exit(1 if mode == 'unauthenticated' else 0)
if args and args[0] == 'api':
    if 'user' in args:
        print('AnotherUser' if mode == 'wrong_owner' else 'Jonoka')
        sys.exit(0)
    if any(a.startswith('repos/') for a in args):
        if mode == 'existing_repository':
            print('HTTP/2.0 200 OK\n\n{}')
            sys.exit(0)
        if mode == 'network_error':
            print('Simulated network failure', file=sys.stderr)
            sys.exit(1)
        print('HTTP/2.0 404 Not Found\n\n{}')
        sys.exit(1)
if args[:2] == ['repo', 'create']:
    if '--private' not in args or '--public' in args:
        print('Only private creation is accepted by this test.', file=sys.stderr)
        sys.exit(2)
    if mode == 'create_denied':
        sys.exit(1)
    subprocess.run(['git', 'init', '--bare', os.environ['MOCK_BARE']], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['git', 'remote', 'add', 'origin', 'https://github.com/' + args[2] + '.git'], check=True)
    sys.exit(0)
if args[:2] == ['repo', 'edit']:
    sys.exit(0 if '--default-branch' in args and 'main' in args else 2)
if args[:2] == ['repo', 'view']:
    if 'defaultBranchRef' in args:
        print('main')
        sys.exit(0)
    print('false' if mode == 'public_visibility' else 'true')
    sys.exit(0)
print('Unexpected mock command', file=sys.stderr)
sys.exit(2)
'''


class BootstrapSafetyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix='formelo-offline-')
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.project = self.base / 'project'
        shutil.copytree(ROOT, self.project, ignore=shutil.ignore_patterns(
            '.git', '__pycache__', '*.pyc', '.local', 'node_modules', 'dist', '.env', '.env.local',
            '.astro', '.sanity', 'coverage', 'test-results', 'playwright-report'
        ))
        self.bin = self.base / 'bin'
        self.bin.mkdir()
        (self.bin / 'gh').write_text('#!' + sys.executable + ' -S\n' + MOCK_GH.split('\n', 1)[1], encoding='utf-8')
        (self.bin / 'gh').chmod(0o755)
        self.bare = self.base / 'remote.git'
        self.log = self.base / 'gh-calls.jsonl'
        self.global_config = self.base / 'gitconfig'
        self.global_config.write_text(
            '[user]\n name = Bootstrap Test\n email = test@local.invalid\n'
            '[commit]\n gpgsign = false\n[init]\n defaultBranch = main\n'
            '[protocol]\n allow = never\n[protocol "file"]\n allow = always\n'
            '[url "' + self.bare.as_uri() + '"]\n'
            ' insteadOf = https://github.com/Jonoka/formelo-works-website.git\n',
            encoding='utf-8',
        )
        # Child tests cannot borrow a real credential, SSH agent, repo or user config.
        self.env = {k: v for k, v in os.environ.items() if not k.startswith(('GIT_', 'GH_', 'GITHUB_')) and k not in {'SSH_AUTH_SOCK', 'SSH_AGENT_PID'}}
        self.env.update({
            'PATH': str(self.bin) + os.pathsep + os.environ.get('PATH', ''),
            'GIT_CONFIG_GLOBAL': str(self.global_config), 'GIT_CONFIG_NOSYSTEM': '1',
            'GIT_TERMINAL_PROMPT': '0', 'MOCK_BARE': str(self.bare),
            'MOCK_LOG': str(self.log), 'MOCK_MODE': 'success',
            'PYTHONDONTWRITEBYTECODE': '1',
        })

    def git(self, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        return subprocess.run(['git', *args], cwd=self.project, env=self.env,
                              capture_output=True, text=True, timeout=20, check=check)

    def run_script(self, mode: str = 'success', *args: str) -> subprocess.CompletedProcess[str]:
        self.env['MOCK_MODE'] = mode
        return subprocess.run(['bash', 'scripts/publish-github.sh', *args], cwd=self.project,
                              env=self.env, capture_output=True, text=True, timeout=30)

    def calls(self) -> list[list[str]]:
        return [json.loads(line) for line in self.log.read_text().splitlines()] if self.log.exists() else []

    def assert_not_created(self, result: subprocess.CompletedProcess[str]) -> None:
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn('SUCCESS:', result.stdout)
        self.assertFalse(any(call[:2] == ['repo', 'create'] for call in self.calls()))
        self.assertFalse(self.bare.exists())

    def test_success_uses_private_and_verifies_real_local_push(self) -> None:
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('Visibility: private', result.stdout)
        create = next(c for c in self.calls() if c[:2] == ['repo', 'create'])
        self.assertIn('--private', create)
        local = self.git('rev-parse', 'HEAD').stdout.strip()
        remote = self.git('--git-dir=' + str(self.bare), 'rev-parse', 'refs/heads/main').stdout.strip()
        self.assertEqual(local, remote)

    def test_missing_auth_stops_before_creation(self) -> None:
        self.assert_not_created(self.run_script('unauthenticated'))

    def test_wrong_account_stops_before_creation(self) -> None:
        self.assert_not_created(self.run_script('wrong_owner'))

    def test_existing_remote_repository_is_not_changed(self) -> None:
        self.assert_not_created(self.run_script('existing_repository'))

    def test_network_error_is_not_treated_as_absence(self) -> None:
        self.assert_not_created(self.run_script('network_error'))

    def test_create_failure_does_not_report_success(self) -> None:
        result = self.run_script('create_denied')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('SUCCESS:', result.stdout)
        self.assertFalse(self.bare.exists())

    def test_public_visibility_blocks_push(self) -> None:
        result = self.run_script('public_visibility')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('No files were pushed', result.stderr)
        self.assertNotEqual(self.git('--git-dir=' + str(self.bare), 'rev-parse', '--verify', 'refs/heads/main', check=False).returncode, 0)

    def test_existing_local_remote_is_preserved(self) -> None:
        self.git('init', '-b', 'main')
        self.git('remote', 'add', 'upstream', 'https://example.invalid/unchanged.git')
        self.assert_not_created(self.run_script())
        self.assertEqual(self.git('remote').stdout.strip(), 'upstream')

    def test_non_main_branch_is_rejected(self) -> None:
        self.git('init', '-b', 'feature/existing-work')
        self.assert_not_created(self.run_script())
        self.assertEqual(self.git('symbolic-ref', '--short', 'HEAD').stdout.strip(), 'feature/existing-work')

    def test_invalid_repo_name_is_rejected(self) -> None:
        self.assert_not_created(self.run_script('success', '../escape'))

    def test_tampered_original_is_rejected(self) -> None:
        with (self.project / 'docs/product/prd-v1.0.md').open('a') as stream:
            stream.write('\nUnexpected change\n')
        self.assert_not_created(self.run_script())

    def test_missing_author_does_not_create_remote(self) -> None:
        content = self.global_config.read_text()
        self.global_config.write_text(content.replace('[user]\n name = Bootstrap Test\n email = test@local.invalid\n', ''))
        self.assert_not_created(self.run_script())

    def test_duplicate_routes_are_rejected(self) -> None:
        file = self.project / 'config/routes.json'
        routes = json.loads(file.read_text())
        routes['pages'][1]['path'] = '/'
        file.write_text(json.dumps(routes))
        self.assert_not_created(self.run_script())

    def test_live_placeholder_contact_is_rejected(self) -> None:
        file = self.project / 'config/site.example.json'
        config = json.loads(file.read_text())
        config['contact']['email'] = 'not-a-real-contact@example.invalid'
        file.write_text(json.dumps(config))
        self.assert_not_created(self.run_script())


if __name__ == '__main__':
    unittest.main()
