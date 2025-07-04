#!/usr/bin/env python3
"""
暗号化機能の検証スクリプト
メモリ暗号化が正しく動作しているかを確認
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openhands.security.memory_encryption import get_memory_encryption
from openhands.core.logger import openhands_logger as logger
import logging

# ログレベルをINFOに設定して詳細ログを表示
logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def test_encryption():
    """暗号化機能をテスト"""
    print("\n=== 暗号化機能検証開始 ===\n")
    
    # 暗号化インスタンスを取得
    encryption = get_memory_encryption()
    
    # テスト用のプロンプト
    test_prompt = """これはテスト用のシステムプロンプトです。
実際のプロンプトには機密情報が含まれている可能性があります。
このテキストが正しく暗号化・復号化されることを確認します。"""
    
    print(f"元のテキスト:\n{test_prompt}\n")
    print(f"元のテキスト長: {len(test_prompt)} 文字\n")
    
    # 暗号化
    print("--- 暗号化中 ---")
    encrypted = encryption.encrypt(test_prompt)
    print(f"\n暗号化されたテキスト:\n{encrypted}\n")
    print(f"暗号化後の長さ: {len(encrypted)} 文字\n")
    
    # 暗号化されているか確認
    is_encrypted = encryption.is_encrypted(encrypted)
    print(f"暗号化チェック: {'✅ 暗号化されています' if is_encrypted else '❌ 暗号化されていません'}\n")
    
    # 復号化
    print("--- 復号化中 ---")
    decrypted = encryption.decrypt(encrypted)
    print(f"\n復号化されたテキスト:\n{decrypted}\n")
    print(f"復号化後の長さ: {len(decrypted)} 文字\n")
    
    # 検証
    if test_prompt == decrypted:
        print("✅ 成功: 元のテキストと復号化されたテキストが一致しました！")
    else:
        print("❌ 失敗: 元のテキストと復号化されたテキストが一致しません")
        print(f"元: {test_prompt[:50]}...")
        print(f"復号化後: {decrypted[:50]}...")
    
    # メモリキャッシュでの暗号化をシミュレート
    print("\n=== メモリキャッシュシミュレーション ===\n")
    
    # SystemMessageActionのデータ構造をシミュレート
    event_data = {
        'action': 'message',
        'args': {
            'content': test_prompt,
            'wait_for_response': True
        }
    }
    
    print("暗号化前のイベントデータ:")
    print(f"content: {event_data['args']['content'][:50]}...\n")
    
    # contentを暗号化
    event_data['args']['content'] = encryption.encrypt(event_data['args']['content'])
    
    print("暗号化後のイベントデータ:")
    print(f"content: {event_data['args']['content'][:70]}...\n")
    
    # メモリに保存されているはずの暗号化されたデータ
    print("メモリキャッシュに保存されるデータ:")
    print(f"- action: {event_data['action']}")
    print(f"- args.content: {event_data['args']['content'][:70]}...")
    print(f"- 暗号化状態: {'✅ 暗号化済み' if encryption.is_encrypted(event_data['args']['content']) else '❌ 平文'}")
    
    print("\n=== 検証完了 ===\n")

if __name__ == "__main__":
    test_encryption()