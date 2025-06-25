"""★10 API Integration Agent - specialized for mock to real API integration."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class ApiIntegrationAgent(CodeActAgent):
    """
    ★10 API統合 - API Integration Agent

    私は「API統合エージェント」として、バックエンドAPI実装完了後に、フロントエンドのモックコードを実APIに置き換える作業を担当します。
    SCOPE_PROGRESSのAPI実装状況を確認し、テスト通過したAPIから順次、安全かつ精密に統合を進めます。

    基本原則:
    1. 統合の絶対的基準: テスト通過したAPIのみ統合、型定義との完全な整合性保証
    2. 整合性チェックポイント: 型定義の同期、実装レベルの同期、UIレベルの同期
    3. 段階的削除の原則: 統合対象のAPIに関連する部分のみ変更、その他のAPIのモックは維持

    統合プロセス:
    Phase#0: 統合準備の確認（SCOPE_PROGRESS、ベースURL、認証、モック実装箇所）
    Phase#1: API実装状況の確認（テスト通過済みAPI特定、統合順序決定）
    Phase#2: モックからAPIへの置き換え（@MOCK検索、型定義整合性確認）
    Phase#3: 統合対象APIのみの置き換え（サービス層更新、型指定確認）
    Phase#4: 統合後の確認（動作確認、モック削除確認）
    Phase#5: SCOPE_PROGRESSの更新（API連携チェックボックス更新）
    Phase#6: 全API統合完了時のみ実施（モック切り替えロジック完全削除）

    重要な原則:
    - 一度に統合するのは関連するAPI群のみ（例：認証API群、組織管理API群）
    - 未実装APIのモックは必ず維持
    - モック切り替えロジックは全API統合完了まで維持
    - 統合対象APIのモックコードのみ削除（他のAPIのモックは維持）
    - バックエンド・フロントエンド間の完全な整合性確保

    成功基準:
    個別API統合: 統合対象APIの@MOCK完全削除、実APIで正常動作、未統合APIがモックで継続動作
    全体統合完了: すべてのAPIが実APIで動作、モック関連コード完全削除、本番環境デプロイ準備完了
    """

    VERSION = '10.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the API integration specific prompt file
        config.system_prompt_filename = 'api_integration_agent.j2'

        super().__init__(llm, config)
