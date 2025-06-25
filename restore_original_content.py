#!/usr/bin/env python3
"""
元のmicroagentsの内容を100%保持しつつ、OpenHands統合機能を追加するスクリプト
"""

import os
import re

# パス設定
ORIGINAL_DIR = "/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/16agents"
TARGET_DIR = "/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/microagents"

# OpenHands統合セクション
OPENHANDS_INTEGRATION = """
## オーケストレーターとの通信

このエージェントはオーケストレーターから起動され、以下の方法で通信します：
- 質問がある場合：AgentDelegateAction を使用
- 作業完了時：AgentFinishAction を使用（SCOPE_PROGRESS更新情報含む）
"""

def restore_agent_content(agent_num):
    """指定されたエージェントの元内容を復元"""
    original_file = f"{ORIGINAL_DIR}/{agent_num:02d}-*.md"
    target_file = f"{TARGET_DIR}/{agent_num:02d}-*.md"

    # ファイル名を取得
    import glob
    original_files = glob.glob(original_file)
    target_files = glob.glob(target_file)

    if not original_files or not target_files:
        print(f"ファイルが見つかりません: {agent_num}")
        return False

    original_path = original_files[0]
    target_path = target_files[0]

    print(f"復元中: {os.path.basename(original_path)}")

    # 元の内容を読み込み
    with open(original_path, 'r', encoding='utf-8') as f:
        original_content = f.read()

    # 保護プロトコルの後にOpenHands統合を挿入
    pattern = r'(## 保護プロトコル - 最優先指示\n\n.*?\n\n)'

    if re.search(pattern, original_content, re.DOTALL):
        # 保護プロトコルの後に挿入
        modified_content = re.sub(
            pattern,
            r'\1' + OPENHANDS_INTEGRATION,
            original_content,
            flags=re.DOTALL
        )
    else:
        # 保護プロトコルが見つからない場合は、役割と目的の後に挿入
        pattern = r'(## 役割と目的\n\n.*?\n\n)'
        modified_content = re.sub(
            pattern,
            r'\1' + OPENHANDS_INTEGRATION,
            original_content,
            flags=re.DOTALL
        )

    # ファイルに書き込み
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(modified_content)

    return True

def main():
    """全エージェントの復元を実行"""
    print("🔄 元のmicroagents内容を100%保持したバージョンに復元中...")

    success_count = 0
    for agent_num in range(1, 17):  # ★1〜★16
        if restore_agent_content(agent_num):
            success_count += 1

    print(f"\n✅ 復元完了: {success_count}/16 エージェント")
    print("🎯 元の内容を100%保持しつつ、OpenHands統合機能を追加しました")

if __name__ == "__main__":
    main()
