#!/bin/bash
# BlueLamp スタンドアロン実行ファイルビルドスクリプト

echo "BlueLamp実行ファイルをビルドします..."

# Poetry環境でPyInstallerを実行
poetry run pyinstaller \
    --name bluelamp \
    --onefile \
    --add-data "openhands:openhands" \
    --add-data "config.toml:." \
    --add-data "pyproject.toml:." \
    --hidden-import openhands \
    --hidden-import openhands.cli \
    --hidden-import openhands.cli.main_session \
    openhands/cli/main_session/__main__.py

echo "ビルド完了！"
echo "実行ファイル: dist/bluelamp"