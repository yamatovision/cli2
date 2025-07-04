#!/usr/bin/env python3
"""
メモリキャッシュの内容を直接確認するツール
実際のBlueLampセッション中のキャッシュデータを検査
"""

import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openhands.events.stream import EventStream
from openhands.security.memory_encryption import get_memory_encryption
import logging

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

def inspect_event_stream_cache(event_stream: EventStream):
    """EventStreamのメモリキャッシュを検査"""
    print("\n=== EventStreamメモリキャッシュの検査 ===\n")
    
    encryption = get_memory_encryption()
    
    # _cache_page_storeの内容を確認
    if hasattr(event_stream, '_cache_page_store'):
        print(f"キャッシュページ数: {len(event_stream._cache_page_store)}")
        
        system_message_count = 0
        encrypted_count = 0
        
        for page_id, events in event_stream._cache_page_store.items():
            print(f"\nページID: {page_id}, イベント数: {len(events)}")
            
            for i, event_data in enumerate(events):
                if isinstance(event_data, dict) and event_data.get('action') == 'message':
                    system_message_count += 1
                    
                    # SystemMessageActionのcontentを確認
                    if 'args' in event_data and 'content' in event_data['args']:
                        content = event_data['args']['content']
                        is_encrypted = encryption.is_encrypted(content)
                        
                        print(f"\n  イベント{i}: SystemMessageAction")
                        print(f"    - 暗号化状態: {'✅ 暗号化済み' if is_encrypted else '❌ 平文'}")
                        print(f"    - コンテンツプレビュー: {content[:70]}...")
                        
                        if is_encrypted:
                            encrypted_count += 1
                            # 復号化してみる
                            try:
                                decrypted = encryption.decrypt(content)
                                print(f"    - 復号化後プレビュー: {decrypted[:50]}...")
                            except Exception as e:
                                print(f"    - 復号化エラー: {e}")
        
        print(f"\n=== 統計 ===")
        print(f"総SystemMessageAction数: {system_message_count}")
        print(f"暗号化されているメッセージ数: {encrypted_count}")
        print(f"暗号化率: {(encrypted_count/system_message_count*100) if system_message_count > 0 else 0:.1f}%")
    else:
        print("キャッシュページストアが見つかりません")
    
    # _write_page_cacheの内容も確認
    if hasattr(event_stream, '_write_page_cache'):
        print(f"\n現在の書き込みページのイベント数: {len(event_stream._write_page_cache)}")

def create_test_event_stream():
    """テスト用のEventStreamを作成"""
    from openhands.storage import get_file_store
    
    # テスト用のファイルストアとEventStreamを作成
    file_store = get_file_store("local", "/tmp/test_bluelamp")
    event_stream = EventStream("test_session", file_store)
    
    # テスト用のSystemMessageActionを追加
    from openhands.events.action.message import MessageAction
    
    test_messages = [
        "これはテスト用のシステムプロンプト1です。",
        "これは機密情報を含む可能性があるプロンプト2です。",
        "Portal APIから取得されたプロンプト3です。"
    ]
    
    for msg in test_messages:
        action = MessageAction(content=msg, wait_for_response=True)
        event_stream.add_event(action)
    
    return event_stream

if __name__ == "__main__":
    print("メモリキャッシュ検査ツール")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # テストモード
        print("\nテストモードで実行中...\n")
        event_stream = create_test_event_stream()
        inspect_event_stream_cache(event_stream)
    else:
        print("\n使い方:")
        print("  python inspect_memory_cache.py --test    # テストデータで検証")
        print("\n実際のBlueLampセッション中に使用する場合は、")
        print("BlueLampのコード内でこの関数を呼び出してください。")