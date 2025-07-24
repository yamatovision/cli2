# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path

# Find site-packages directory dynamically
site_packages = None
for p in sys.path:
    if 'site-packages' in p and os.path.exists(p):
        site_packages = p
        break

if not site_packages:
    raise RuntimeError("Could not find site-packages directory")

# Build data files list
datas = [
    ('extensions', 'extensions'), 
    ('core', 'core'), 
    ('pyproject.toml', '.'),
]

# Add tiktoken_ext if it exists
tiktoken_path = os.path.join(site_packages, 'tiktoken_ext')
if os.path.exists(tiktoken_path):
    datas.append((tiktoken_path, 'tiktoken_ext'))

# Add litellm if it exists
litellm_path = os.path.join(site_packages, 'litellm')
if os.path.exists(litellm_path):
    datas.append((litellm_path, 'litellm'))

a = Analysis(
    ['extensions/cli/main_session/__main__.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'extensions', 
        'extensions.cli', 
        'extensions.cli.main_session',
        'tiktoken_ext.openai_public',
        'tiktoken_ext'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='bluelamp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)