# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files

datas = [('core/config', 'core/config')]
datas += collect_data_files('tiktoken')
datas += collect_data_files('litellm')


a = Analysis(
    ['test_binary.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=['tiktoken_ext.openai_public'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'pandas', 'numpy', 'PIL', 'Pillow', 'cv2', 'opencv-python', 'opencv-python-headless', 'scipy', 'sklearn', 'torch', 'tensorflow', 'jupyter', 'notebook', 'IPython', 'qtconsole', 'PyQt5', 'PyQt6', 'tkinter', 'wx', 'gtk', 'plotly', 'seaborn', 'bokeh', 'dash', 'streamlit', 'gradio', 'flask', 'django', 'fastapi.staticfiles', 'speech_recognition', 'pydub', 'moviepy', 'ffmpeg', 'imageio', 'reportlab', 'openpyxl', 'xlsxwriter', 'xlrd', 'pyodbc', 'psycopg2', 'pymongo', 'redis', 'celery', 'gevent'],
    noarchive=False,
    optimize=2,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [('O', None, 'OPTION'), ('O', None, 'OPTION')],
    name='bluelamp-lite',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
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
