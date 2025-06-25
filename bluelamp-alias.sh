#!/bin/bash

# BlueLamp CLIのエイリアス設定スクリプト
# このスクリプトを実行すると、blueLampコマンドがどこからでも使えるようになります

BLUELAMP_CLI_DIR="/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli"

# エイリアスの設定
echo "BlueLamp CLIのエイリアスを設定しています..."

# 使用しているシェルを確認
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    echo "警告: シェルの種類を特定できませんでした。手動で設定してください。"
    exit 1
fi

# エイリアスを追加
echo "" >> "$SHELL_CONFIG"
echo "# BlueLamp CLI" >> "$SHELL_CONFIG"
echo "alias bluelamp='cd $BLUELAMP_CLI_DIR && poetry run python -m openhands.cli.main --config-file $BLUELAMP_CLI_DIR/agent_configs.toml'" >> "$SHELL_CONFIG"

echo "✅ エイリアスが設定されました！"
echo ""
echo "以下のコマンドを実行してエイリアスを有効にしてください："
echo "  source $SHELL_CONFIG"
echo ""
echo "または、新しいターミナルを開いてください。"