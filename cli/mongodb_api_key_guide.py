#!/usr/bin/env python3
"""
MongoDB API Key（秘密鍵）取得の具体的な動作フロー
"""

def mongodb_api_key_flow():
    """
    実際のBrowser Agentの動作フローを示す
    """
    
    print("=== MongoDB API Key 取得フロー ===\n")
    
    # ステップ1: ログイン
    print("1️⃣ [Browser Agent] ログインページへ移動")
    print("   実行: browser_agent.goto('https://cloud.mongodb.com/v2#/login')")
    print("   ユーザー指示: メールとパスワードを入力してログイン\n")
    
    # ステップ2: プロジェクト選択
    print("2️⃣ [Browser Agent] プロジェクトダッシュボード分析")
    print("   検出: 複数のプロジェクトがある場合、リストを表示")
    print("   ユーザー指示: 使用するプロジェクトを選択\n")
    
    # ステップ3: Access Manager へ移動
    print("3️⃣ [Browser Agent] ナビゲーション分析")
    print("   実行: browser_agent.find_and_click('Access Manager')")
    print("   結果: 左側メニューの 'Access Manager' を検出\n")
    
    # ステップ4: API Keys タブ
    print("4️⃣ [Browser Agent] API Keys セクションへ")
    print("   実行: browser_agent.click('API Keys')")
    print("   表示: 既存のAPIキーリスト（もしあれば）\n")
    
    # ステップ5: 新規APIキー作成
    print("5️⃣ [Browser Agent] APIキー作成開始")
    print("   実行: browser_agent.click('Create API Key')")
    print("   フォーム検出:")
    print("     - Description 入力欄")
    print("     - Permissions チェックボックス")
    print("   ユーザー指示: ")
    print("     - 説明を入力（例: 'Production API Key'）")
    print("     - 必要な権限を選択:")
    print("       ✓ Project Read Only（読み取り専用）")
    print("       ✓ Project Read/Write（読み書き）")
    print("       ✓ Project Owner（全権限）\n")
    
    # ステップ6: IPアドレス制限
    print("6️⃣ [Browser Agent] セキュリティ設定")
    print("   検出: IP Address Whitelist セクション")
    print("   ユーザー指示:")
    print("     - 特定のIPを追加 または")
    print("     - '0.0.0.0/0' で全てのIPを許可（開発用）\n")
    
    # ステップ7: APIキー生成
    print("7️⃣ [Browser Agent] APIキー生成完了")
    print("   実行: browser_agent.click('Generate API Key')")
    print("   🔑 重要: ここで表示される情報")
    print("     - Public Key: 63a1b2c3d4e5f6g7h8i9j0k1")
    print("     - Private Key: l2m3n4o5-p6q7-r8s9-t0u1-v2w3x4y5z6a7")
    print("   ⚠️  警告: Private Key は一度しか表示されません！\n")
    
    # ステップ8: 保存確認
    print("8️⃣ [Browser Agent] 保存確認")
    print("   メッセージ: 'Have you saved your private key?'")
    print("   ユーザー指示: ")
    print("     1. Private Key を安全な場所にコピー")
    print("     2. 環境変数またはシークレット管理ツールに保存")
    print("     3. 'Yes, I've saved it' をクリック\n")
    
    # 使用例
    print("=== 取得したAPIキーの使用方法 ===")
    print("""
# 環境変数に設定
export MONGODB_PUBLIC_KEY="63a1b2c3d4e5f6g7h8i9j0k1"
export MONGODB_PRIVATE_KEY="l2m3n4o5-p6q7-r8s9-t0u1-v2w3x4y5z6a7"

# Pythonでの使用例
from pymongo import MongoClient
client = MongoClient(
    f"mongodb+srv://{public_key}:{private_key}@cluster0.mongodb.net/"
)

# または MongoDB Atlas Admin API での使用
curl -u "{public_key}:{private_key}" \\
  https://cloud.mongodb.com/api/atlas/v1.0/groups/{GROUP-ID}/clusters
""")

if __name__ == "__main__":
    mongodb_api_key_flow()