"""File-ledger unit fixtures only; header stubs are NOT decoded photographs or website assets."""
import copy
import hashlib
from pathlib import Path
import struct
import tempfile
import unittest

from scripts.check_repository import validate_generated_asset


class ConceptAssetLedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='formelo-asset-ledger-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        # Only integrity/header validation is exercised here. Chromium tests decode served images.
        source_bytes = bytes.fromhex('89504e470d0a1a0a') + b'Synthetic ledger test, not a photograph'
        web_bytes = b'RIFF' + struct.pack('<I', 4) + b'WEBP'
        def entry(path, data, fmt):
            file = self.root / path
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(data)
            return dict(path=path, sha256=hashlib.sha256(data).hexdigest(), sizeBytes=len(data), format=fmt, width=1, height=1)
        source = entry('assets/concepts/source/hero.png', source_bytes, 'image/png')
        web = entry('web/public/media/concepts/hero-1.webp', web_bytes, 'image/webp')
        self.asset = dict(id='HERO-001', status='generated_concept', source='AI-generated concept',
                          conceptStatus='concept_only', generationOutput='independent_image',
                          productionAllowed=False, replacementRequiredBeforeLaunch=True,
                          approval='pending_user_review', dimensions=dict(width=1, height=1),
                          sourceImage=source, renditions=[web], **web)

    def test_integrity_metadata_and_headers_are_checked(self):
        self.assertEqual(validate_generated_asset(self.asset, self.root), [])

    def test_modified_source_is_rejected(self):
        (self.root / self.asset['sourceImage']['path']).write_bytes(b'Tampered')
        self.assertTrue(validate_generated_asset(self.asset, self.root))

    def test_missing_rendition_is_rejected(self):
        (self.root / self.asset['renditions'][0]['path']).unlink()
        self.assertTrue(validate_generated_asset(self.asset, self.root))

    def test_wrong_format_is_rejected(self):
        self.asset['renditions'][0]['format'] = 'image/avif'
        self.assertTrue(validate_generated_asset(self.asset, self.root))

    def test_reference_cannot_become_a_concept_source(self):
        self.asset['sourceImage']['path'] = 'assets/reference/homepage-selected-v1.webp'
        self.assertTrue(validate_generated_asset(self.asset, self.root))

    def test_false_provenance_and_production_claims_are_rejected(self):
        for change in [dict(generationOutput='triptych'), dict(source='Real factory photograph'),
                       dict(productionAllowed=True), dict(replacementRequiredBeforeLaunch=False)]:
            asset = copy.deepcopy(self.asset)
            asset.update(change)
            self.assertTrue(validate_generated_asset(asset, self.root))


if __name__ == '__main__':
    unittest.main()
