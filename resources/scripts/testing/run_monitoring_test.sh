#!/bin/bash
cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2
source test_env/bin/activate

# ポート3001を占有するテストサーバーを起動
python3 -c "
import http.server
import socketserver
import threading
import time

PORT = 3001
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    try:
        with socketserver.TCPServer(('', PORT), Handler) as httpd:
            print(f'Test server on port {PORT}')
            httpd.serve_forever()
    except:
        pass

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(2)
print('Test server started')
time.sleep(300)  # 5分間維持
" &

TEST_SERVER_PID=$!
sleep 3

# テストタスクファイル作成
cat > test_monitoring_task.txt << 'EOF'
TASK: サーバー起動コマンドを実行してください。

以下のコマンドを実行してください：
cd /Users/tatsuya/Desktop/variantsupporter/backend && npm start

このコマンドはポート競合エラーを発生させます。
監視ログを確認してスタック箇所を特定してください。
EOF

echo "🚀 監視機能付きOpenHands実行開始"
echo "   ユーザー確認プロンプトで 't' を入力してください"
echo "   監視ログに注目してください"

# OpenHands実行
python3 -m openhands.cli.main_session \
    --task test_monitoring_task.txt \
    --agent-cls OrchestratorAgent \
    --max-iterations 5

# クリーンアップ
kill $TEST_SERVER_PID 2>/dev/null
rm -f test_monitoring_task.txt

echo "✅ テスト完了"
