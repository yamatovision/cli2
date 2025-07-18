"""
プロンプトマッピング設定
エージェント名とPortal側プロンプトIDのマッピング（15エージェント構造）
Portal APIのみを使用し、ローカル.j2ファイルは使用しません
"""

# エージェント名 → Portal プロンプトID (15エージェント構造: 00, 01-14)
PROMPT_MAPPING = {
    # 00: オーケストレーター (OrchestratorAgent用)
    'orchestrator': '6862397f1428c1efc592f6cc',
    # ★11: 拡張オーケストレーター (ExtensionManagerAgent用)
    'expansion_orchestrator': '6862397f1428c1efc592f6e0',
    # 01: 要件定義エンジニア
    'requirements_engineer': '6862397f1428c1efc592f6ce',
    # 02: UIUXデザイナー
    'uiux_designer': '6862397f1428c1efc592f6d0',
    # 03: データモデリングエンジニア
    'data_modeling_engineer': '6862397f1428c1efc592f6d2',
    # 04: システムアーキテクト
    'system_architect': '6862397f1428c1efc592f6d4',
    # 05: 実装計画コンサルタント
    'implementation_consultant': '6862397f1428c1efc592f6d6',
    # 06: 環境構築
    'environment_setup': '6862397f1428c1efc592f6d8',
    # 07: プロトタイプ実装
    'prototype_implementation': '687771cb8854a35d228fff5f',
    # 08: 実装エージェント
    'implementation_agent': '6862397f1428c1efc592f6da',
    # 09: デバッグエージェント v3.0
    'debug_agent': '6862397f1428c1efc592f6dc',
    # 10: デプロイスペシャリスト
    'deploy_specialist': '6862397f1428c1efc592f6de',
    # 12: 新ページ作成エージェント
    'page_creator': '6862397f1428c1efc592f6e2',
    # 13: コード徹底除去専門リファクタリングエージェント v1.0
    'refactoring_engineer': '6862397f1428c1efc592f6e4',
    # 14: Universal AI-Friendliness診断プロンプト v3.0
    'ai_friendliness_diagnostic': '6862397f1428c1efc592f6e6',
}

# 逆マッピング（プロンプトID → エージェント名）
ID_TO_AGENT = {v: k for k, v in PROMPT_MAPPING.items()}

# プロンプトタイトルマッピング（デバッグ用）- 15エージェント構造
PROMPT_TITLES = {
    '6862397f1428c1efc592f6cc': '#00 オーケストレーター',
    '6862397f1428c1efc592f6e0': '★11 拡張オーケストレーター',
    '6862397f1428c1efc592f6ce': '#01 要件定義エンジニア',
    '6862397f1428c1efc592f6d0': '#02 UI/UXデザイナー',
    '6862397f1428c1efc592f6d2': '#03 データモデリングエンジニア',
    '6862397f1428c1efc592f6d4': '#04 システムアーキテクト',
    '6862397f1428c1efc592f6d6': '★5 実装計画コンサルタント',
    '6862397f1428c1efc592f6d8': '★6 環境構築',
    '687771cb8854a35d228fff5f': '★7 プロトタイプ実装',
    '6862397f1428c1efc592f6da': '★8 実装エージェント',
    '6862397f1428c1efc592f6dc': '★09 デバッグエージェント v3.0',
    '6862397f1428c1efc592f6de': '#10 デプロイスペシャリスト',
    '6862397f1428c1efc592f6e2': '★12 新ページ作成エージェント',
    '6862397f1428c1efc592f6e4': '#13 コード徹底除去専門リファクタリングエージェント v1.0',
    '6862397f1428c1efc592f6e6': '#14 Universal AI-Friendliness診断プロンプト v3.0',
}

# プロンプトIDからエージェント名への逆引きマップ
ID_TO_AGENT = {v: k for k, v in PROMPT_MAPPING.items()}

def get_prompt_id(agent_name: str) -> str | None:
    """エージェント名からPortal プロンプトIDを取得"""
    return PROMPT_MAPPING.get(agent_name)

def get_prompt_id_by_agent_name(agent_name: str) -> int:
    """エージェント名から数値プロンプトIDを取得（テスト用）"""
    agent_names = list(PROMPT_MAPPING.keys())
    if agent_name in agent_names:
        return agent_names.index(agent_name)
    raise ValueError(f"Unknown agent name: {agent_name}")

def get_agent_name(prompt_id: str) -> str | None:
    """Portal プロンプトIDからエージェント名を取得"""
    return ID_TO_AGENT.get(prompt_id)

def get_prompt_title(prompt_id: str) -> str:
    """Portal プロンプトIDからタイトルを取得"""
    return PROMPT_TITLES.get(prompt_id, 'Unknown Prompt')

def is_portal_prompt(agent_name: str) -> bool:
    """エージェント名がPortal連携対象かチェック"""
    return agent_name in PROMPT_MAPPING

def get_all_agents() -> list[str]:
    """全エージェント名のリストを取得"""
    return list(PROMPT_MAPPING.keys())

def get_all_prompt_ids() -> list[str]:
    """全プロンプトIDのリストを取得"""
    return list(PROMPT_MAPPING.values())

