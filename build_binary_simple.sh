#!/bin/bash
# BlueLamp CLI 簡易バイナリビルドスクリプト

echo "🚀 BlueLamp CLI バイナリビルダー"
echo "=================================================="

# 1. クリーンアップ
echo -e "\n1. ビルドディレクトリのクリーンアップ"
rm -rf build dist __pycache__
echo "✓ クリーンアップ完了"

# 2. PyInstallerのインストール（Poetry環境で実行）
echo -e "\n2. PyInstallerの確認とインストール"
poetry run pip install pyinstaller

# 3. ビルド実行
echo -e "\n3. バイナリのビルド"
poetry run pyinstaller \
    --name bluelamp \
    --onefile \
    --clean \
    --noconfirm \
    --collect-all litellm \
    --collect-all tiktoken \
    --collect-all tiktoken_ext \
    --hidden-import=tiktoken_ext.openai_public \
    --hidden-import=tiktoken_ext \
    --hidden-import=PyGithub \
    --hidden-import=github \
    --hidden-import=frontmatter \
    --hidden-import=jwt \
    --hidden-import=google.protobuf \
    --add-data "resources:resources" \
    --add-data "core/config:core/config" \
    --add-data "extensions:extensions" \
    test_binary.py

# 4. 結果確認
echo -e "\n=================================================="
if [ -f "dist/bluelamp" ]; then
    echo "✅ ビルドが正常に完了しました！"
    echo "バイナリの場所: $(pwd)/dist/bluelamp"
    echo ""
    echo "動作テスト方法:"
    echo "  ./dist/bluelamp --help"
else
    echo "❌ ビルドに失敗しました"
    exit 1
fi