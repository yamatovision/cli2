#!/usr/bin/env python3
"""
現在のBlueLampセッションの暗号化状態を確認
"""

import json
import os
import glob

# セッションディレクトリ
session_dir = os.path.expanduser("~/.openhands/sessions/81d5b768-4a2c-44d1-97ee-bc752bc2f78d-cba2a96af55f50a7")
cache_dir = os.path.join(session_dir, "event_cache")
events_dir = os.path.join(session_dir, "events")

print("=== 現在のBlueLampセッションの暗号化状態確認 ===\n")

# キャッシュファイルを確認
cache_files = glob.glob(os.path.join(cache_dir, "*.json"))
print(f"キャッシュファイル数: {len(cache_files)}\n")

encrypted_count = 0
plain_count = 0
system_messages = []

for cache_file in cache_files:
    with open(cache_file, 'r') as f:
        try:
            events = json.load(f)
            for event in events:
                if isinstance(event, dict) and event.get('action') == 'message':
                    if 'args' in event and 'content' in event.get('args', {}):
                        content = event['args']['content']
                        if content.startswith('ENCRYPTED:'):
                            encrypted_count += 1
                            print(f"✅ 暗号化されたSystemMessage発見:")
                            print(f"   ファイル: {os.path.basename(cache_file)}")
                            print(f"   暗号化コンテンツ: {content[:70]}...")
                            print()
                        else:
                            plain_count += 1
                            # 平文の場合は最初の50文字を表示
                            print(f"❌ 平文のSystemMessage:")
                            print(f"   ファイル: {os.path.basename(cache_file)}")
                            print(f"   平文コンテンツ: {content[:50]}...")
                            print()
        except json.JSONDecodeError:
            print(f"JSONパースエラー: {cache_file}")

# イベントファイルも確認
event_files = glob.glob(os.path.join(events_dir, "*.json"))
print(f"\nイベントファイル数: {len(event_files)}")

# 最新のイベントをチェック
if event_files:
    latest_events = sorted(event_files)[-5:]  # 最新5ファイル
    print("\n最新のイベントファイルをチェック中...")
    
    for event_file in latest_events:
        with open(event_file, 'r') as f:
            try:
                event = json.load(f)
                if event.get('action') == 'message':
                    content = event.get('args', {}).get('content', '')
                    if content:
                        if content.startswith('ENCRYPTED:'):
                            print(f"✅ イベントファイルで暗号化確認: {os.path.basename(event_file)}")
                        else:
                            print(f"❌ イベントファイルは平文: {os.path.basename(event_file)}")
                            print(f"   内容: {content[:50]}...")
            except:
                pass

print(f"\n=== 統計 ===")
print(f"暗号化されたメッセージ: {encrypted_count}")
print(f"平文のメッセージ: {plain_count}")
print(f"暗号化率: {(encrypted_count/(encrypted_count+plain_count)*100) if (encrypted_count+plain_count) > 0 else 0:.1f}%")

if encrypted_count > 0:
    print("\n✅ 暗号化機能は正常に動作しています！")
    print("SystemMessageActionのコンテンツがメモリキャッシュで暗号化されています。")
else:
    print("\n⚠️  このセッションではまだ暗号化されたメッセージが見つかりません。")
    print("Portal APIから取得したプロンプトがまだ使用されていない可能性があります。")