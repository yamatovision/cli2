# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [('resources', 'resources'), ('core/config', 'core/config'), ('extensions', 'extensions')]
binaries = []
hiddenimports = ['tiktoken_ext.openai_public', 'tiktoken_ext', 'PyGithub', 'github', 'frontmatter', 'jwt', 'google.protobuf']
tmp_ret = collect_all('litellm')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('tiktoken')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('tiktoken_ext')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]


a = Analysis(
    ['test_binary.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # GUI関連
        'matplotlib', 'jupyter', 'notebook',
        'IPython', 'qtconsole', 'PyQt5', 'PyQt6', 'tkinter',
        
        # 削除済み重量ライブラリ
        'pandas', 'numpy', 'scipy', 'sklearn', 'seaborn',
        'speechrecognition', 'speech_recognition',
        'tree_sitter', 'tree_sitter_languages', 'tree-sitter-language-pack',
        'networkx', 'libcst', 'pdfminer', 'pdfminer.six',
        'youtube_transcript_api', 'grep_ast',
        
        # 開発・テスト関連
        'pytest', 'unittest', 'doctest', 'pdb', 'profile', 'cProfile',
        'pstats', 'timeit', 'trace', 'dis', 'py_compile',
        
        # 不要なエンコーディング
        'encodings.cp1252', 'encodings.latin1', 'encodings.iso8859_1',
        'encodings.ascii', 'encodings.big5', 'encodings.gb2312',
        
        # 不要なロケール
        'locale', 'calendar', 'gettext',
        
        # 不要なネットワーク
        'ftplib', 'poplib', 'imaplib', 'nntplib', 'smtplib',
        'telnetlib', 'xmlrpc',
    ],
    noarchive=False,
    optimize=2,  # 最適化レベルを上げる
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='bluelamp_optimized',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,  # バイナリストリップを有効化
    upx=True,    # UPX圧縮を有効化
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
