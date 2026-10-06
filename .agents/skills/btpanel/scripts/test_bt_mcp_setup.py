import importlib.util
from contextlib import redirect_stderr, redirect_stdout
import io
import json
import os
from pathlib import Path
import stat
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('bt_setup', Path(__file__).with_name('bt_mcp_setup.py'))
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class ResultSecurityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='bt-result-security-')
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'result.json'
        self.payload = {'status': 'ok', 'probe': 'non-sensitive fixture'}

    def run_main(self):
        arguments = setup.argparse.Namespace(target=None, ssh_port=22, allow_ips='127.0.0.1', mcp_host=None,
                                             auto_upgrade=False, result_file=self.path, yes=True, dry_run=False)
        with patch.object(setup, 'parse_args', return_value=arguments), redirect_stderr(io.StringIO()), redirect_stdout(io.StringIO()):
            return setup.main()

    def test_complete_json_and_real_platform_permissions(self):
        setup.write_result(self.path, self.payload)
        self.assertEqual(json.loads(self.path.read_text(encoding='utf-8')), self.payload)
        if os.name == 'nt':
            script = '''$ErrorActionPreference='Stop';
$a=Get-Acl -LiteralPath $env:BT_RESULT_TEST_PATH;
$s=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value;
$r=@($a.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]));
[pscustomobject]@{protected=$a.AreAccessRulesProtected;ownerMatches=($a.GetOwner([Security.Principal.SecurityIdentifier]).Value -eq $s);count=$r.Count;onlyCurrentUser=($r.Count -eq 1 -and $r[0].IdentityReference.Value -eq $s -and -not $r[0].IsInherited -and $r[0].AccessControlType -eq 'Allow' -and $r[0].FileSystemRights -eq [Security.AccessControl.FileSystemRights]::FullControl)} | ConvertTo-Json -Compress'''
            environment = os.environ.copy()
            environment.pop('PSModulePath', None)
            environment['BT_RESULT_TEST_PATH'] = str(self.path)
            result = subprocess.run([shutil.which('pwsh') or 'powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], env=environment, capture_output=True, text=True, check=False, creationflags=subprocess.CREATE_NO_WINDOW)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout), {'protected': True, 'ownerMatches': True, 'count': 1, 'onlyCurrentUser': True})
        else:
            self.assertEqual(stat.S_IMODE(self.path.stat().st_mode), 0o600)

    def test_existing_output_is_never_overwritten(self):
        self.path.write_text('previous output', encoding='utf-8')
        with self.assertRaises(OSError):
            setup.write_result(self.path, self.payload)
        self.assertEqual(self.path.read_text(encoding='utf-8'), 'previous output')

    def test_main_rejects_existing_output_before_network_or_installation(self):
        self.path.write_text('previous output', encoding='utf-8')
        with patch.object(setup, 'download_installer') as download, patch.object(setup, 'run_installer') as install:
            self.assertEqual(self.run_main(), 1)
            download.assert_not_called()
            install.assert_not_called()
        self.assertEqual(self.path.read_text(encoding='utf-8'), 'previous output')

    def test_main_reserves_empty_output_before_network_and_cleans_failure(self):
        def reject():
            self.assertTrue(self.path.exists())
            self.assertEqual(self.path.stat().st_size, 0)
            raise RuntimeError('injected download failure; no network request')
        with patch.object(setup, 'download_installer', side_effect=reject), patch.object(setup, 'run_installer') as install:
            self.assertEqual(self.run_main(), 1)
            install.assert_not_called()
        self.assertFalse(self.path.exists())

    def test_interruption_closes_and_cleans_reserved_output(self):
        with patch.object(setup, 'download_installer', side_effect=KeyboardInterrupt), patch.object(setup, 'run_installer') as install:
            with self.assertRaises(KeyboardInterrupt):
                self.run_main()
            install.assert_not_called()
        self.assertFalse(self.path.exists())

    def test_main_writes_reserved_result_after_mocked_installer(self):
        installer = self.path.with_name('isolated-installer.sh')
        installer.write_text('# non-executable isolated fixture', encoding='utf-8')
        result = {'status': 'ok', 'probe': 'non-sensitive fixture'}
        output = (setup.RESULT_START + '\n' + json.dumps(result) + '\n' + setup.RESULT_END).encode()
        completed = subprocess.CompletedProcess([], 0, stdout=output, stderr=b'')
        with patch.object(setup, 'download_installer', return_value=(installer, setup.INSTALLER_SHA256)), patch.object(setup, 'run_installer', return_value=completed):
            self.assertEqual(self.run_main(), 0)
        self.assertEqual(json.loads(self.path.read_text(encoding='utf-8'))['probe'], result['probe'])
        self.assertFalse(installer.exists())

    def test_serialization_failure_does_not_create_output(self):
        with self.assertRaises(TypeError):
            setup.write_result(self.path, {'invalid': object()})
        self.assertFalse(self.path.exists())

    @unittest.skipUnless(os.name == 'nt', 'Windows DACL verification')
    def test_acl_failure_happens_before_payload_and_cleans_empty_file(self):
        def reject(*args):
            self.assertEqual(self.path.stat().st_size, 0)
            raise OSError('injected ACL verification failure')
        with patch.object(setup, '_verify_windows_result_handle', side_effect=reject):
            with self.assertRaises(OSError):
                setup.write_result(self.path, self.payload)
        self.assertFalse(self.path.exists())
        setup.write_result(self.path, self.payload)
        self.assertEqual(json.loads(self.path.read_text()), self.payload)

    def test_write_failure_cleans_only_created_output(self):
        with patch.object(setup.os, 'fsync', side_effect=OSError('injected write failure')):
            with self.assertRaises(OSError):
                setup.write_result(self.path, self.payload)
        self.assertFalse(self.path.exists())
        setup.write_result(self.path, self.payload)
        self.assertEqual(json.loads(self.path.read_text()), self.payload)

    def test_existing_symlink_and_target_are_preserved(self):
        target = self.path.with_name('existing.txt')
        target.write_text('previous target', encoding='utf-8')
        try:
            self.path.symlink_to(target)
        except OSError:
            self.skipTest('OS does not allow this user to create a test symlink')
        with self.assertRaises(OSError):
            setup.write_result(self.path, self.payload)
        self.assertTrue(self.path.is_symlink())
        self.assertEqual(target.read_text(encoding='utf-8'), 'previous target')


if __name__ == '__main__':
    unittest.main()
