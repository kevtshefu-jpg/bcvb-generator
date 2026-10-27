"""Static safety contract for BCVB Storage P0 manual SQL.

Run from repository root:
  python -m unittest discover -s tests/security -p 'test_storage_p0_contract.py' -v
This is not a PostgreSQL execution or Storage HTTP test.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
CONFINEMENT = ROOT / "ops/manual/storage-p0-confinement-2026-10-27.sql"
RECOVERY = ROOT / "ops/manual/storage-p0-emergency-restore-2026-10-27.sql"
NAMES = (
    "Allow authenticated users to read files",
    "Allow authenticated users to read files fr5e4b_0",
    "Allow authenticated users to read objects",
)


class StorageP0Contract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.confine = CONFINEMENT.read_text(encoding="utf-8")
        cls.recover = RECOVERY.read_text(encoding="utf-8")

    def test_manual_only(self):
        self.assertIn("ops/manual/", CONFINEMENT.as_posix())
        self.assertIn("ops/manual/", RECOVERY.as_posix())
        self.assertIn("DO NOT execute on production", self.confine)
        self.assertIn("EMERGENCY RECOVERY ONLY", self.recover)

    def test_transactions(self):
        for sql in (self.confine, self.recover):
            self.assertRegex(sql, r"(?m)^BEGIN;$")
            self.assertRegex(sql, r"(?m)^COMMIT;$")
            self.assertIn("SET LOCAL lock_timeout = '5s'", sql)

    def test_exact_drop_policy_targets(self):
        dropped = re.findall(r'(?m)^DROP POLICY "([^"]+)" ON storage\.objects;', self.confine)
        self.assertCountEqual(dropped, NAMES)
        self.assertEqual(len(dropped), 3)
        self.assertNotRegex(self.confine, r"(?im)^\s*(DROP TABLE|TRUNCATE|DELETE FROM|UPDATE|ALTER TABLE)\b")

    def test_fail_closed_guards(self):
        for fragment in (
            "pg_policies", "relrowsecurity", "storage.buckets",
            "id='Bcvb-library'", "id='bcvb-library'",
            "qual IS DISTINCT FROM", "with_check IS NOT NULL",
            "RAISE EXCEPTION", "cmd <> 'SELECT'",
            "permissive <> 'PERMISSIVE'",
            "roles <> ARRAY['authenticated']::name[]",
        ):
            self.assertIn(fragment, self.confine)

    def test_recovery_policy_targets(self):
        created = re.findall(r'(?m)^CREATE POLICY "([^"]+)" ON storage\.objects', self.recover)
        self.assertCountEqual(created, NAMES)
        self.assertEqual(self.recover.count("bucket_id = 'Bcvb-library'::text"), 1)
        self.assertEqual(self.recover.count("bucket_id = 'bcvb-library'::text"), 2)
        self.assertNotRegex(self.recover, r"(?im)^\s*(DROP TABLE|TRUNCATE|DELETE FROM|UPDATE)\b")


if __name__ == "__main__":
    unittest.main()
