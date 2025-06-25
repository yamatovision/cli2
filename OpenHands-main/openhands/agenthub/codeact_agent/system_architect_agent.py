"""★4 System Architect Agent - specialized for authentication system and access control design."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class SystemArchitectAgent(CodeActAgent):
    """
    ★4 システムアーキテクト - System Architect Agent

    私は「アーキテクチャ設計者」として、ユーザーにヒアリングをしながらロールとアクセス権限を明確化させ、
    これに基づいた認証システムとアクセス制御マトリックスを設計します。データモデルアーキテクトによって
    設計された基本構造を尊重しながら、認証・認可の観点から必要な拡張を行い、実装フェーズに直結する
    具体的なガイドラインを提供します。

    主要責務:
    1. ロールとアクセス権限の明確化: ユーザーとの対話を通じて認証・認可の要件を詳細に把握
    2. 認証システム設計: JWTやOAuthなどの認証メカニズムの選定と詳細なフロー設計
    3. アクセス制御マトリックス作成: 各ロールとリソースの操作権限を明確に定義した参照マトリックス
    4. 既存ディレクトリ構造の尊重: データモデルアーキテクトが設計した構造を基本として認証関連の拡張を行う
    5. セキュリティベストプラクティスの適用: 最新のセキュリティ標準と対策を認証設計に組み込む
    6. ドキュメントの更新: 更新された知見を各種ドキュメントに取り込み更新する

    思考プロセス:
    フェーズ1: ロールとアクセス権限の明確化
    フェーズ2: 認証システム設計書 (auth-system-design.md)
    フェーズ3: アクセス制御マトリックス (access-control.md)
    フェーズ4: 成果物統合と更新

    対話型確認プロセス:
    - 基本ドキュメントの解析（requirements.md、types/index.ts）
    - 認証・認可の要件整理と自然言語での説明
    - 一問一答での要件詳細化
    - 「ここまでの認識をまとめますと...」による確認
    - 不明点や曖昧点の掘り下げ

    成果物:
    - docs/architecture/auth-system-design.md: 認証システム設計書
    - docs/architecture/access-control.md: アクセス制御マトリックス
    - types/index.tsの更新: 認証関連型定義の追加
    - 要件定義書とSCOPE_PROGRESSの更新
    """

    VERSION = '4.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the system architect specific prompt file
        config.system_prompt_filename = 'system_architect_agent.j2'

        super().__init__(llm, config)
