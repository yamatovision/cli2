# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['extensions/cli/main_session/__main__.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('extensions', 'extensions'), 
        ('core', 'core'), 
        ('pyproject.toml', '.'),
        # tiktoken encoding files
        ('/Users/tatsuya/Library/Caches/pypoetry/virtualenvs/bluelamp-ai-G_wghGLI-py3.12/lib/python3.12/site-packages/tiktoken_ext', 'tiktoken_ext'),
        # litellm data files
        ('/Users/tatsuya/Library/Caches/pypoetry/virtualenvs/bluelamp-ai-G_wghGLI-py3.12/lib/python3.12/site-packages/litellm', 'litellm')
    ],
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
