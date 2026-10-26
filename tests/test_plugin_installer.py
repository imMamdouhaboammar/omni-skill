import shutil
import subprocess
import tempfile
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'skills/repo-craft-and-distribute/install.sh'

class ExplicitInstallerTests(unittest.TestCase):
    def test_copy_existing_and_recursive_destinations(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'source'
            source.mkdir()
            shutil.copy2(SOURCE, source / 'install.sh')
            (source / 'SKILL.md').write_text('original')
            dest = root / 'chosen'
            run = lambda p: subprocess.run(['bash', str(source / 'install.sh'), str(p)], capture_output=True)
            self.assertEqual(run(dest).returncode, 0)
            (dest / 'SKILL.md').write_text('customized')
            self.assertNotEqual(run(dest).returncode, 0)
            self.assertEqual((dest / 'SKILL.md').read_text(), 'customized')
            self.assertNotEqual(run(source / 'nested').returncode, 0)
            self.assertFalse((source / 'nested').exists())

if __name__ == '__main__':
    unittest.main()
