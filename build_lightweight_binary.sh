#!/bin/bash
# BlueLamp CLI 軽量バイナリビルドスクリプト

echo "🚀 BlueLamp CLI 軽量バイナリビルダー"
echo "=================================================="

# 1. クリーンアップ
echo -e "\n1. ビルドディレクトリのクリーンアップ"
rm -rf build dist __pycache__
echo "✓ クリーンアップ完了"

# 2. 軽量化のための環境変数設定
echo -e "\n2. 軽量化設定"
export PYTHONOPTIMIZE=2
export PYTHONDONTWRITEBYTECODE=1

# 3. PyInstallerのインストール（Poetry環境で実行）
echo -e "\n3. PyInstallerの確認とインストール"
poetry run pip install pyinstaller

# 4. 軽量化ビルド実行
echo -e "\n4. 軽量バイナリのビルド"
poetry run pyinstaller \
    --name bluelamp-lite \
    --onefile \
    --clean \
    --noconfirm \
    --optimize=2 \
    --strip \
    --exclude-module matplotlib \
    --exclude-module jupyter \
    --exclude-module notebook \
    --exclude-module IPython \
    --exclude-module qtconsole \
    --exclude-module PyQt5 \
    --exclude-module PyQt6 \
    --exclude-module tkinter \
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

# 5. UPX圧縮（さらなる軽量化）
echo -e "\n5. UPX圧縮による追加軽量化"
if command -v upx &> /dev/null; then
    echo "UPXで圧縮中..."
    upx --best --lzma dist/bluelamp-lite
    echo "✓ UPX圧縮完了"
else
    echo "⚠️  UPXがインストールされていません。さらなる軽量化のためにUPXのインストールを推奨します："
    echo "   macOS: brew install upx"
    echo "   Ubuntu: sudo apt install upx-ucl"
    echo "   Windows: choco install upx"
fi

# 6. 結果確認
echo -e "\n=================================================="
if [ -f "dist/bluelamp-lite" ]; then
    echo "✅ 軽量ビルドが正常に完了しました！"
    echo ""
    echo "📊 サイズ比較:"
    if [ -f "dist/bluelamp" ]; then
        echo "  通常版: $(du -h dist/bluelamp | cut -f1)"
    fi
    echo "  軽量版: $(du -h dist/bluelamp-lite | cut -f1)"
    echo ""
    echo "バイナリの場所: $(pwd)/dist/bluelamp-lite"
    echo ""
    echo "動作テスト方法:"
    echo "  ./dist/bluelamp-lite --help"
else
    echo "❌ ビルドに失敗しました"
    exit 1
fi