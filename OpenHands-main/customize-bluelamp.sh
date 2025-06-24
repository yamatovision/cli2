#!/bin/bash

# BlueLamp用のOpenHandsカスタマイズスクリプト

echo "🔧 BlueLamp用にOpenHandsをカスタマイズしています..."

# バックアップディレクトリを作成
BACKUP_DIR="./openhands_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 元のファイルをバックアップ
echo "📁 元のファイルをバックアップ中..."
cp openhands/cli/tui.py "$BACKUP_DIR/"
cp openhands/cli/main.py "$BACKUP_DIR/"

# tui.pyのカスタマイズ
echo "✏️  tui.pyをカスタマイズ中..."

# ASCIIアートの変更
cat > /tmp/bluelamp_banner.txt << 'EOF'
def display_banner(session_id: str) -> None:
    """Display the BlueLamp banner."""
    print_formatted_text(
        HTML(r"""<blue>
    ____  __            __
   / __ )/ /_  _____  / /   ____ _____ ___  ____
  / __  / / / / / _ \/ /   / __ `/ __ `__ \/ __ \
 / /_/ / / /_/ /  __/ /___/ /_/ / / / / / / /_/ /
/_____/_/\__,_/\___/_____/\__,_/_/ /_/ /_/ .___/
                                         /_/

    ブルーランプ - 要件定義アシスタント
    </blue>"""),
        style=DEFAULT_STYLE,
    )
    print_formatted_text(
        HTML(f'<grey>セッションID: {session_id}</grey>\n'), style=DEFAULT_STYLE
    )
EOF

# Pythonスクリプトでtui.pyを修正
python3 << 'EOF'
import re

# tui.pyを読み込み
with open('openhands/cli/tui.py', 'r', encoding='utf-8') as f:
    content = f.read()

# display_banner関数を置換
banner_pattern = r'def display_banner\(session_id: str\) -> None:.*?(?=^def|\Z)'
with open('/tmp/bluelamp_banner.txt', 'r') as f:
    new_banner = f.read()

content = re.sub(banner_pattern, new_banner, content, flags=re.MULTILINE | re.DOTALL)

# メッセージの日本語化
replacements = [
    # ウェルカムメッセージ
    ("Let's start building!", "さあ、開発を始めましょう！"),
    ("What do you want to build?", "何を作りたいですか？"),
    ("Type /help for help", "ヘルプは /help を入力してください"),

    # エージェント状態メッセージ
    ("Agent running...", "エージェント実行中..."),
    ("Press Ctrl-P to pause", "Ctrl-P で一時停止"),
    ("Agent paused...", "エージェント一時停止中..."),
    ("Press /resume to continue", "/resume で再開"),
    ("Task finished...", "タスク完了..."),
    ("Agent is waiting for your input...", "ブルーランプはあなたの発言を待っています..."),

    # プロンプト
    ("message, type ctrl-d to send:", "メッセージを入力してCtrl-Dで送信:"),
    ("Are you sure you want to", "本当に実行しますか？"),
    ("(y)es/(n)o/(a)lways", "(y)はい/(n)いいえ/(a)常に"),

    # コマンドヘルプ
    ("'exit': 'Exit the application',", "'exit': 'アプリケーションを終了',"),
    ("'help': 'Show available commands',", "'help': '利用可能なコマンドを表示',"),
    ("'init': 'Initialize a new repository',", "'init': '新しいリポジトリを初期化',"),
    ("'status': 'Show conversation details and usage',", "'status': '会話の詳細と使用状況を表示',"),
    ("'new': 'Create a new conversation',", "'new': '新しい会話を作成',"),
    ("'settings': 'Show and update current settings',", "'settings': '現在の設定を表示・変更',"),
    ("'resume': 'Resume the paused agent',", "'resume': '一時停止中のエージェントを再開',"),

    # ランタイムメッセージ
    ("Firing up the local runtime", "ローカルランタイムを起動中"),
    ("Firing up the docker runtime", "Dockerランタイムを起動中"),

    # その他
    ("OpenHands CLI", "BlueLamp CLI"),
]

for old, new in replacements:
    content = content.replace(old, new)

# ファイルに書き込み
with open('openhands/cli/tui.py', 'w', encoding='utf-8') as f:
    f.write(content)

# main.pyも修正
with open('openhands/cli/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'What do you want to build?'", "'何を作りたいですか？'")
content = content.replace("OpenHands CLI", "BlueLamp CLI")

with open('openhands/cli/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ カスタマイズ完了!")
EOF

echo "🎉 BlueLamp用のカスタマイズが完了しました！"
echo ""
echo "元のファイルは以下にバックアップされています："
echo "  $BACKUP_DIR"
echo ""
echo "元に戻す場合："
echo "  cp $BACKUP_DIR/* openhands/cli/"
