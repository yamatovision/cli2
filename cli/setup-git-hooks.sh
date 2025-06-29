#!/bin/bash
#
# Git Hooks セットアップスクリプト
# 自動タイムスタンプ機能の設定
#

set -e

echo "🔧 Git Hooks セットアップを開始します..."

# プロジェクトルートディレクトリの確認
if [ ! -d ".git" ]; then
    echo "❌ エラー: Gitリポジトリが見つかりません"
    echo "   プロジェクトルートディレクトリで実行してください"
    exit 1
fi

# .git/hooksディレクトリの確認
if [ ! -d ".git/hooks" ]; then
    echo "📁 .git/hooksディレクトリを作成します..."
    mkdir -p .git/hooks
fi

# 既存のフックファイルのバックアップ
backup_hook() {
    local hook_name=$1
    if [ -f ".git/hooks/$hook_name" ] && [ ! -f ".git/hooks/$hook_name.backup" ]; then
        echo "💾 既存の$hook_nameをバックアップします..."
        cp ".git/hooks/$hook_name" ".git/hooks/$hook_name.backup"
    fi
}

# prepare-commit-msgフックの設定
echo "⚙️  prepare-commit-msgフックを設定します..."
backup_hook "prepare-commit-msg"

cat > .git/hooks/prepare-commit-msg << 'EOF'
#!/bin/sh
#
# Git prepare-commit-msg hook
# 日本時間（JST）でのタイムスタンプを自動追加
#

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2
SHA1=$3

# マージコミットやamendコミットの場合は何もしない
if [ "$COMMIT_SOURCE" = "merge" ] || [ "$COMMIT_SOURCE" = "commit" ]; then
    exit 0
fi

# 日本時間（JST）でのタイムスタンプを生成
if command -v gdate >/dev/null 2>&1; then
    SHORT_TIME=$(TZ='Asia/Tokyo' gdate '+%m-%d %H:%M')
else
    SHORT_TIME=$(TZ='Asia/Tokyo' date '+%m-%d %H:%M')
fi

# 既存のコミットメッセージを読み込み
if [ -f "$COMMIT_MSG_FILE" ]; then
    ORIGINAL_MSG=$(cat "$COMMIT_MSG_FILE")
else
    ORIGINAL_MSG=""
fi

# 既にタイムスタンプが含まれているかチェック
if echo "$ORIGINAL_MSG" | grep -q "^\[.*[0-9][0-9]:[0-9][0-9].*\]" || \
   echo "$ORIGINAL_MSG" | grep -q "JST\]"; then
    exit 0
fi

# 空のコミットメッセージの場合は何もしない
if [ -z "$ORIGINAL_MSG" ] || [ "$ORIGINAL_MSG" = "" ]; then
    exit 0
fi

# コミットメッセージの先頭にタイムスタンプを追加
echo "[$SHORT_TIME] $ORIGINAL_MSG" > "$COMMIT_MSG_FILE"

exit 0
EOF

chmod +x .git/hooks/prepare-commit-msg

# post-commitフックの設定
echo "⚙️  post-commitフックを設定します..."
backup_hook "post-commit"

cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh
#
# Git post-commit hook
# コミット完了後の通知とログ記録
#

# 日本時間でのタイムスタンプを生成
if command -v gdate >/dev/null 2>&1; then
    JST_TIME=$(TZ='Asia/Tokyo' gdate '+%Y-%m-%d %H:%M:%S JST')
else
    JST_TIME=$(TZ='Asia/Tokyo' date '+%Y-%m-%d %H:%M:%S JST')
fi

# 最新のコミット情報を取得
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
AUTHOR=$(git log -1 --pretty=%an)
FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD | wc -l | tr -d ' ')

# コミット完了通知
echo ""
echo "✅ コミットが完了しました！"
echo "📅 時刻: $JST_TIME"
echo "🔗 ハッシュ: $COMMIT_HASH"
echo "👤 作成者: $AUTHOR"
echo "📁 変更ファイル数: $FILES_CHANGED"
echo "💬 メッセージ: $COMMIT_MSG"
echo ""

exit 0
EOF

chmod +x .git/hooks/post-commit

# 動作確認
echo "🧪 セットアップの動作確認..."

# フックファイルの存在と権限確認
if [ -x ".git/hooks/prepare-commit-msg" ]; then
    echo "✅ prepare-commit-msgフック: 正常"
else
    echo "❌ prepare-commit-msgフック: エラー"
    exit 1
fi

if [ -x ".git/hooks/post-commit" ]; then
    echo "✅ post-commitフック: 正常"
else
    echo "❌ post-commitフック: エラー"
    exit 1
fi

# 日本時間の動作確認
if command -v gdate >/dev/null 2>&1; then
    TEST_TIME=$(TZ='Asia/Tokyo' gdate '+%m-%d %H:%M')
    echo "✅ 日本時間取得: $TEST_TIME (GNU date使用)"
else
    TEST_TIME=$(TZ='Asia/Tokyo' date '+%m-%d %H:%M')
    echo "✅ 日本時間取得: $TEST_TIME (標準date使用)"
fi

echo ""
echo "🎉 Git Hooks セットアップが完了しました！"
echo ""
echo "📋 設定内容:"
echo "   - prepare-commit-msg: コミットメッセージに日本時間を自動追加"
echo "   - post-commit: コミット完了後の詳細情報表示"
echo ""
echo "🚀 使用方法:"
echo "   git commit -m \"あなたのコミットメッセージ\""
echo "   → 自動的に \"[MM-DD HH:MM] あなたのコミットメッセージ\" に変換されます"
echo ""
echo "📖 詳細情報: docs/git-hooks-setup.md を参照してください"
echo ""

# オプション: テストコミットの提案
echo "🧪 テストコミットを実行しますか？ (y/n)"
read -r response
if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    echo "📝 テストファイルを作成してテストコミットを実行します..."
    
    # テストファイルの作成
    echo "# Git Hooks テスト" > git-hooks-test.txt
    echo "作成日時: $(date)" >> git-hooks-test.txt
    
    # テストコミット
    git add git-hooks-test.txt
    git commit -m "Git Hooks 自動タイムスタンプ機能のテスト"
    
    # テストファイルの削除
    rm git-hooks-test.txt
    git add git-hooks-test.txt
    git commit -m "テストファイルを削除"
    
    echo "✅ テストコミットが完了しました！"
fi

echo "🏁 セットアップ完了"