"""CI bootstrap ordering tests; no network, GitHub API or artifact service is used."""
from pathlib import Path
import unittest

from scripts.check_repository import validate_ci_workflow


ROOT = Path(__file__).resolve().parents[1]


class CiWorkflowOrderingTests(unittest.TestCase):
    def test_current_bootstrap_validation_precedes_artifact_upload(self) -> None:
        workflow = (ROOT / '.github/workflows/repository-checks.yml').read_text(encoding='utf-8')
        self.assertEqual(validate_ci_workflow(workflow), [])

    def test_upload_before_required_validation_is_rejected(self) -> None:
        workflow = """jobs:
  bootstrap:
    steps:
      - name: Package the exact tracked source
        run: git archive HEAD
      - uses: actions/upload-artifact@example
      - name: Validate documentation and assets
        run: python3 scripts/check_repository.py
      - name: Validate shell syntax
        run: bash -n scripts/publish-github.sh
      - name: Run offline bootstrap safety tests
        run: python3 -m unittest discover
  foundation:
    steps: []
"""
        errors = validate_ci_workflow(workflow)
        self.assertEqual(len(errors), 3)
        self.assertTrue(all('before artifact upload' in error for error in errors))


if __name__ == '__main__':
    unittest.main()
