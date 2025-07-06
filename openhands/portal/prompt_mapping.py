"""
プロンプトマッピング設定
ローカルプロンプトファイル名とPortal側プロンプトIDのマッピング
"""

# ローカルファイル名 → Portal プロンプトID
PROMPT_MAPPING = {
    'refactoring_expert.j2': '6862397f1428c1efc592f6ec',
    'data_modeling_engineer.j2': '6862397f1428c1efc592f6d2',
    'feature_extension.j2': '6862397f1428c1efc592f6ea',
    'system_architect.j2': '6862397f1428c1efc592f6d4',
    'debug_detective.j2': '6862397f1428c1efc592f6e2',
    'environment_setup.j2': '6862397f1428c1efc592f6d8',
    'ui_ux_designer.j2': '6862397f1428c1efc592f6d0',
    'test_quality_verification.j2': '6862397f1428c1efc592f6de',
    'github_manager.j2': '6862397f1428c1efc592f6e6',
    'typescript_manager.j2': '6862397f1428c1efc592f6e8',
    'orchestrator.j2': '6862397f1428c1efc592f6cc',
    'backend_implementation.j2': '6862397f1428c1efc592f6dc',
    'deploy_specialist.j2': '6862397f1428c1efc592f6e4',
    'api_integration.j2': '6862397f1428c1efc592f6e0',
    'implementation_consultant.j2': '6862397f1428c1efc592f6d6',
    'prototype_implementation.j2': '6862397f1428c1efc592f6da',
    'requirements_engineer.j2': '6862397f1428c1efc592f6ce',
    'system_prompt.j2': '6862397f1428c1efc592f6cc',  # BlueLampオーケストレーター
}

# 逆マッピング（プロンプトID → ローカルファイル名）
ID_TO_LOCAL = {v: k for k, v in PROMPT_MAPPING.items()}

# プロンプトタイトルマッピング（デバッグ用）
PROMPT_TITLES = {
    '6862397f1428c1efc592f6ec': '#16 リファクタリングエキスパート',
    '6862397f1428c1efc592f6d2': '#3 データモデリングエンジニア',
    '6862397f1428c1efc592f6ea': '#15 機能拡張プランナー',
    '6862397f1428c1efc592f6d4': '#4 システムアーキテクト',
    '6862397f1428c1efc592f6e2': '#11 デバッグ探偵',
    '6862397f1428c1efc592f6d8': '#6 環境構築',
    '6862397f1428c1efc592f6d0': '#2 UI/UXデザイナー',
    '6862397f1428c1efc592f6de': '#9 テスト・品質検証',
    '6862397f1428c1efc592f6e6': '#13 GitHubマネージャー',
    '6862397f1428c1efc592f6e8': '#14 TypeScriptマネージャー',
    '6862397f1428c1efc592f6cc': '#0 オーケストレーター',
    '6862397f1428c1efc592f6dc': '#8 バックエンド実装',
    '6862397f1428c1efc592f6e4': '#12 デプロイスペシャリスト',
    '6862397f1428c1efc592f6e0': '#10 API統合',
    '6862397f1428c1efc592f6d6': '#5 実装コンサルタント',
    '6862397f1428c1efc592f6da': '#7 プロトタイプ実装',
    '6862397f1428c1efc592f6ce': '#1 要件定義エンジニア',
}

def get_prompt_id(local_filename: str) -> str | None:
    """ローカルファイル名からPortal プロンプトIDを取得"""
    return PROMPT_MAPPING.get(local_filename)

def get_local_filename(prompt_id: str) -> str | None:
    """Portal プロンプトIDからローカルファイル名を取得"""
    return ID_TO_LOCAL.get(prompt_id)

def get_prompt_title(prompt_id: str) -> str:
    """Portal プロンプトIDからタイトルを取得"""
    return PROMPT_TITLES.get(prompt_id, 'Unknown Prompt')

def is_portal_prompt(local_filename: str) -> bool:
    """ローカルファイル名がPortal連携対象かチェック"""
    return local_filename in PROMPT_MAPPING