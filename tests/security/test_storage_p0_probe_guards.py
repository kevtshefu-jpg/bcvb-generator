import pathlib
import subprocess
import sys
import unittest

SCRIPT = pathlib.Path(__file__).with_name('storage_p0_http_probe.py')

class GuardTests(unittest.TestCase):
    def test_production_is_rejected(self):
        import os
        env = dict(os.environ, BCVB_TEST_URL='https://leziahqmqyuewpzjmzxf.supabase.co', BCVB_TEST_ANON_KEY='fake', BCVB_TEST_USER_JWT='fake', BCVB_TEST_BUCKET='Bcvb-library', BCVB_TEST_OBJECT='p0-test/fixture.txt')
        result = subprocess.run([sys.executable, str(SCRIPT), 'confined'], env=env, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('REFUSED', result.stdout + result.stderr)

    def test_invalid_phase_is_rejected(self):
        import os
        env = dict(os.environ, BCVB_TEST_URL='https://ahqrrqgebtfzssmeizfu.supabase.co', BCVB_TEST_ANON_KEY='fake', BCVB_TEST_USER_JWT='fake', BCVB_TEST_BUCKET='Bcvb-library', BCVB_TEST_OBJECT='p0-test/fixture.txt')
        result = subprocess.run([sys.executable, str(SCRIPT), 'production'], env=env, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Phase must', result.stdout + result.stderr)

if __name__ == '__main__':
    unittest.main()
