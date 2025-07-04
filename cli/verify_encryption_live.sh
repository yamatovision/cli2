#!/bin/bash

echo "🛡️ BlueLamp メモリキャッシュ暗号化 ライブ検証"
echo "=" * 60

echo "📋 検証手順:"
echo "1. BlueLampを起動"
echo "2. エージェントとやりとり"
echo "3. ログで暗号化・復号化を確認"
echo "4. メモリキャッシュファイルを直接確認"
echo ""

# ログディレクトリを確認
LOG_DIR="$HOME/.cache/bluelamp/logs"
CACHE_DIR="$HOME/.cache/bluelamp"

echo "📁 ログディレクトリ: $LOG_DIR"
echo "📁 キャッシュディレクトリ: $CACHE_DIR"
echo ""

# BlueLampを起動（バックグラウンド）
echo "🚀 BlueLampを起動中..."
cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli

# ログレベルをINFOに設定してより詳細なログを出力
export BLUELAMP_LOG_LEVEL=INFO

# BlueLampを起動
echo "💡 以下のコマンドでBlueLampを起動してください:"
echo "cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli"
echo "export BLUELAMP_LOG_LEVEL=INFO"
echo "./bluelamp"
echo ""

echo "🔍 暗号化確認方法:"
echo "1. エージェントとやりとり後、ログで以下を確認:"
echo "   - '🔒 MEMORY ENCRYPTION:' メッセージ"
echo "   - '🔓 MEMORY DECRYPTION:' メッセージ"
echo ""

echo "2. 別ターミナルで以下を実行してキャッシュを確認:"
echo "   python3 test_encryption_verification.py"
echo ""

echo "3. ログファイルを直接確認:"
echo "   tail -f ~/.cache/bluelamp/logs/bluelamp.log | grep -E '🔒|🔓|ENCRYPT'"
echo ""

echo "✅ 期待される結果:"
echo "- SystemMessageActionが 'ENCRYPTED:' で始まる"
echo "- ログに暗号化・復号化メッセージが表示される"
echo "- AI機能が正常に動作する"