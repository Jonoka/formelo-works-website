#!/usr/bin/env python3
"""Offline bootstrap checks; not a security audit or a test of the future website."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import sys
from pathlib import Path
from typing import Any

SKIP_DIRS = {'.git', '__pycache__', 'node_modules', '.astro', '.sanity', 'dist', '.local'}
REQUIRED = [
    'README.md', 'AGENTS.md', 'CONTRIBUTING.md', '.gitignore', '.env.example',
    'docs/decisions/0001-approved-direction.md', 'docs/design/visual-baseline.md',
    'docs/design/tokens.json', 'docs/reference/import-manifest.json',
    'docs/development/workflow.md', 'docs/development/backlog.md',
    'docs/operations/runbook.md', 'config/routes.json', 'config/site.example.json',
    'assets/manifest.json', 'scripts/publish-github.sh',
    '.github/workflows/repository-checks.yml',
]


def validate(root: Path) -> dict[str, Any]:
    root = root.resolve()
    errors: list[str] = []
    checks: list[str] = []

    def require(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    def safe_path(relative: str) -> Path:
        path = (root / relative).resolve()
        if root not in path.parents:
            raise ValueError('Path leaves project directory: ' + relative)
        return path

    def read_json(relative: str) -> Any:
        return json.loads(safe_path(relative).read_text(encoding='utf-8'))

    for name in REQUIRED:
        require(safe_path(name).is_file(), 'Missing required file: ' + name)
    if errors:
        return {'status': 'failed', 'checks': checks, 'errors': errors}
    checks.append('Required documentation, configuration and scripts exist.')

    try:
        imports = read_json('docs/reference/import-manifest.json')['files']
        require(len(imports) == 4, 'Expected three original Markdown files and one viewing preview.')
        imported_paths = set()
        for item in imports:
            name = item['repositoryPath']
            imported_paths.add(name)
            data = safe_path(name).read_bytes()
            require(len(data) == item['sizeBytes'], 'Imported file size changed: ' + name)
            require(hashlib.sha256(data).hexdigest() == item['sha256'], 'Imported file checksum changed: ' + name)
        checks.append('Three original Markdown files and the viewing preview match four SHA-256 records.')

        routes = read_json('config/routes.json')
        pages = routes['pages']
        paths = [p['path'] for p in pages]
        require(len(pages) == 10 and len(set(paths)) == 10, 'Expected 10 unique content routes.')
        require(len({p['template'] for p in pages}) == 8, 'Expected eight template types.')
        require(sum(p['productionIndexable'] is True for p in pages) == 9, 'Expected nine planned production-indexable pages.')
        require(routes['defaultPreviewIndexable'] is False, 'Previews must not be indexable by default.')
        for path in paths:
            require(path.startswith('/') and path.endswith('/') and '..' not in path, 'Invalid planned route: ' + path)
        for item in routes['navigation']:
            for href in item.get('children', [item.get('href')]):
                require(isinstance(href, str) and href.split('#')[0] in paths, 'Navigation target missing: ' + str(href))
        require(routes['processLink'] == '/manufacturing/#production', 'Process must remain a manufacturing-page anchor.')
        require(any(i.get('label') == 'Journal' and i.get('href') == '/blog/' for i in routes['navigation']), 'Journal must retain /blog/.')
        checks.append('Planned routes: 10 URLs, eight templates, nine future indexable pages.')

        config = read_json('config/site.example.json')
        require(config['brand']['displayName'] == 'FORMELO WORKS' and config['brand']['isProvisional'] is True, 'Bootstrap brand must be marked provisional.')
        require(config['site']['conceptMode'] is True and config['site']['productionApproved'] is False, 'Bootstrap must remain a non-production concept.')
        require(config['site']['analyticsMode'] == 'off', 'Analytics must default to off.')
        for key in ('email', 'whatsappDigits'):
            require(config['contact'][key] is None, 'Do not include invented live contact values: ' + key)
        require(not config['contact']['emailEnabled'] and not config['contact']['whatsappEnabled'], 'Unconfigured contact channels must be disabled.')
        checks.append('Provisional branding, unconfigured contacts, analytics off and concept flags checked.')

        assets = read_json('assets/manifest.json')['assets']
        require(len({a['id'] for a in assets}) == len(assets), 'Duplicate asset IDs.')
        for asset in assets:
            require(asset['productionAllowed'] is False, 'No current concept/reference asset is approved for production.')
            if asset['path'] is not None:
                data = safe_path(asset['path']).read_bytes()
                require(hashlib.sha256(data).hexdigest() == asset['sha256'], 'Asset checksum mismatch: ' + asset['id'])
            else:
                require(asset['status'] in {'pending_generation', 'awaiting_factory'}, 'Missing file must have an explicit pending status: ' + asset['id'])
        image = safe_path('assets/reference/homepage-selected-v1.webp').read_bytes()
        require(image[:4] == b'RIFF' and image[8:12] == b'WEBP', 'Reference preview must be WebP.')
        require(struct.unpack('<I', image[4:8])[0] + 8 == len(image), 'WebP file size mismatch.')
        require(image[12:16] == b'VP8 ' and image[23:26] == b'\x9d\x01\x2a', 'Unexpected preview encoding.')
        require(tuple(v & 0x3fff for v in struct.unpack('<HH', image[26:30])) == (768, 1152), 'Preview dimensions changed.')
        read_json('docs/design/tokens.json')
        checks.append('Reference preview is 768x1152; original PNG stays in the source archive. Other assets remain pending.')

        token_patterns = [
            re.compile(r'gh[pousr]_[A-Za-z0-9]{30,}'),
            re.compile(r'github_pat_[A-Za-z0-9_]{30,}'),
            re.compile(r'sk-(?:proj-)?[A-Za-z0-9_-]{35,}'),
        ]
        forbidden_suffixes = {'.pem', '.key', '.p12', '.pfx', '.woff', '.woff2', '.ttf', '.otf'}
        for path in root.rglob('*'):
            relative = path.relative_to(root)
            if set(relative.parts) & SKIP_DIRS:
                continue
            if path.is_symlink():
                errors.append('Do not ship symlinks in the bootstrap: ' + str(relative))
                continue
            if not path.is_file():
                continue
            if path.name.startswith('.env') and path.name != '.env.example':
                continue  # Real local env files are gitignored, not release inputs.
            require(path.suffix.lower() not in forbidden_suffixes, 'Do not ship credentials or font files: ' + str(relative))
            if path.suffix.lower() not in {'.md', '.json', '.py', '.sh', '.yml', '.yaml'} and path.name != '.env.example':
                continue
            text = path.read_text(encoding='utf-8')
            require(not any(pattern.search(text) for pattern in token_patterns), 'Possible credential found (value not displayed): ' + str(relative))
            if path.suffix != '.md' or str(relative) in imported_paths:
                continue
            prose = re.sub(r'```.*?```', '', text, flags=re.S)
            for match in re.finditer(r'!?\[[^\]]*\]\(([^\s)]+)\)', prose):
                link = match.group(1)
                if link.startswith(('#', 'https:', 'http:', 'mailto:', 'sandbox:')):
                    continue
                target = (path.parent / link.split('#')[0]).resolve()
                require(target.exists(), 'Broken local Markdown link: ' + str(relative) + ' -> ' + link)
        checks.append('New Markdown links and common credential/font-file exclusions checked (not exhaustive security scanning).')

        workflow = safe_path('.github/workflows/repository-checks.yml').read_text(encoding='utf-8')
        require('contents: read' in workflow and 'persist-credentials: false' in workflow, 'CI must have read-only permissions and no persisted checkout credential.')
        require('pull_request_target' not in workflow and 'secrets.' not in workflow, 'Bootstrap CI must not use elevated triggers or secrets.')
        require('scripts/check_repository.py' in workflow and 'unittest discover' in workflow, 'CI check commands missing.')
        checks.append('CI is a repository-check workflow, not website deployment.')
    except (OSError, KeyError, ValueError, TypeError, struct.error) as exc:
        errors.append('Validation could not finish: ' + str(exc))
    return {'status': 'passed' if not errors else 'failed', 'checks': checks, 'errors': errors}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--json', action='store_true', help='Print machine-readable output.')
    args = parser.parse_args()
    result = validate(args.root)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print('Bootstrap validation: ' + result['status'].upper())
        for check in result['checks']:
            print('  CHECK: ' + check)
        for error in result['errors']:
            print('  ERROR: ' + error, file=sys.stderr)
        print('Not evaluated: website behavior, real GitHub writes, hosted CI or deployment.')
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
