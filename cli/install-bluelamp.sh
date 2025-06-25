#!/bin/bash

# BlueLamp インストールスクリプト

echo "🔧 BlueLamp コマンドをインストールしています..."

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# シンボリックリンクを作成する関数
create_symlink() {
    local target="$1"
    local link_name="$2"

    # 既存のリンクやファイルがある場合は削除
    if [ -e "$link_name" ]; then
        echo "⚠️  既存の $link_name を削除します..."
        sudo rm -f "$link_name"
    fi

    # シンボリックリンクを作成
    echo "🔗 $link_name を作成中..."
    sudo ln -s "$target" "$link_name"
}

# /usr/local/bin にシンボリックリンクを作成
if [ -d "/usr/local/bin" ]; then
    create_symlink "$SCRIPT_DIR/bluelamp" "/usr/local/bin/bluelamp"
    create_symlink "$SCRIPT_DIR/bluelamp" "/usr/local/bin/ブルーランプ"
    echo "✅ /usr/local/bin にインストールしました"
else
    echo "❌ /usr/local/bin が見つかりません"
    exit 1
fi

# 動作確認
if command -v bluelamp &> /dev/null; then
    echo "✅ bluelamp コマンドが正常にインストールされました"
    echo ""
    echo "使い方:"
    echo "  bluelamp        # 英語コマンド"
    echo "  ブルーランプ     # 日本語コマンド"
    echo ""
else
    echo "❌ インストールに失敗しました"
    echo "PATHに /usr/local/bin が含まれているか確認してください:"
    echo "  echo \$PATH"
fi
