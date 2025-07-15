#!/bin/bash

# BlueLamp AI - PyPI公開スクリプト

echo "🔵 BlueLamp AI をPyPIに公開します"
echo ""

# 1. パッケージをビルド
echo "📦 パッケージをビルド中..."
poetry build

if [ $? -ne 0 ]; then
    echo "❌ ビルドに失敗しました"
    exit 1
fi

echo "✅ ビルド完了"
echo ""

# 2. TestPyPIに公開（テスト用）
echo "🧪 TestPyPIに公開中..."
echo "注意: TestPyPIのAPIトークンが必要です"
echo "poetry config pypi-token.testpypi <your-testpypi-token> を実行してください"
echo ""
read -p "TestPyPIに公開しますか？ (y/N): " confirm_test

if [[ $confirm_test =~ ^[Yy]$ ]]; then
    poetry publish --repository testpypi
    echo "✅ TestPyPIに公開完了"
    echo "テスト: pip install --index-url https://test.pypi.org/simple/ bluelamp-ai"
    echo ""
fi

# 3. 本番PyPIに公開
echo "🚀 本番PyPIに公開"
echo "注意: PyPIのAPIトークンが必要です"
echo "poetry config pypi-token.pypi <your-pypi-token> を実行してください"
echo ""
read -p "本番PyPIに公開しますか？ (y/N): " confirm_prod

if [[ $confirm_prod =~ ^[Yy]$ ]]; then
    poetry publish
    echo "✅ PyPIに公開完了"
    echo "インストール: pip install bluelamp-ai"
    echo ""
fi

echo "🎉 公開プロセス完了"
echo ""
echo "📋 使用方法:"
echo "  pip install bluelamp-ai"
echo "  ブルーランプ          # オーケストレーター起動"
echo "  ブルーランプ拡張      # 拡張マネージャー起動"