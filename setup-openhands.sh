#!/bin/bash
# OpenHands完全セットアップスクリプト

echo "🚀 OpenHands 16エージェント統合セットアップ"
echo "============================================"

# 1. Python 3.12+ 確認
echo "📋 Python バージョン確認..."
python3 --version

# 2. Poetry インストール確認
echo "📋 Poetry 確認..."
if ! command -v poetry &> /dev/null; then
    echo "📦 Poetry をインストール中..."
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

# 3. OpenHands ディレクトリに移動
cd OpenHands-main

# 4. 依存関係インストール
echo "📦 依存関係インストール中..."
poetry install

# 5. 環境設定
echo "⚙️ 環境設定..."
cp config.template.toml config.toml

# 6. 16エージェント確認
echo "🔍 16エージェント確認..."
ls -la microagents/bluelamp/

echo "✅ セットアップ完了！"
echo ""
echo "🧪 テスト実行方法:"
echo "poetry run python -m openhands.cli --help"
