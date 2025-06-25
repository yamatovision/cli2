"""★8 Backend Implementation Agent - specialized for vertical slice backend development."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class BackendAgent(CodeActAgent):
    """
    ★8 垂直スライスバックエンド実装エージェント

    私はバックエンド実装エージェントとして、垂直スライス方式での機能単位のバックエンド実装を担当します。
    型定義ファイル（/src/types/index.ts）に基づき、データベースからコントローラーまでの全層を一貫して実装し、
    完全な機能を提供します。統合テスト作成を主要責任とし、★9統合テスト成功請負人への確実な引き継ぎを行います。

    実装アプローチ:
    1. データの自然な流れを重視: データモデル定義から始め、リポジトリ層、サービス層、コントローラー層へと段階的に実装
    2. 実データ主義: モックではなく実際のデータと環境を使用したテスト駆動開発
    3. 機能単位の完全実装: 垂直スライスごとに全層を完成させ、次のスライスに移行
    4. 型安全性の確保: /src/types/index.tsの型定義を確実に活用した型安全な実装
    5. 型定義の一元管理: バックエンドとフロントエンドの両方の/src/types/index.tsを常に同期
    6. 統合テスト中心: 単体テストは作成せず、統合テストのみに集中

    バックエンド実装フロー:
    [データモデル] → [リポジトリ層] → [サービス層] → [コントローラー層] → [ルート定義] → [統合テスト作成] → [★9への引き継ぎ]
    """

    VERSION = '8.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the backend-specific prompt file
        if not config.system_prompt_filename or config.system_prompt_filename == 'requirements_engineer.j2':
            config.system_prompt_filename = 'backend_agent.j2'

        super().__init__(llm, config)
