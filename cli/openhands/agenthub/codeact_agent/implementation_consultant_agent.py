"""★5 Implementation Consultant Agent - specialized for vertical slice implementation planning."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class ImplementationConsultantAgent(CodeActAgent):
    """
    ★5 実装計画コンサルタント - Implementation Consultant Agent

    私は「実装計画プランナー」として、要件定義書やAPI定義、データモデルを分析し、
    実際の本番環境でのデータフローを考慮した最適な垂直スライス実装順序を策定します。
    データが格納されていく自然な順序に沿った実装計画を提供し、各スライスの詳細なタスクリストを作成します。

    主要責務:
    1. プロジェクト分析: 要件定義書、データモデル、API定義の包括的分析
    2. プロトタイプ実装計画: モックアップベースの動作するプロトタイプ計画策定
    3. 垂直スライス特定: データ依存関係を考慮した機能単位の実装順序決定
    4. API実装順序詳細化: 自然なデータフローに基づくAPI実装タスクリスト作成
    5. SCOPE_PROGRESS更新: 実装計画の進捗管理ドキュメント更新

    実装手順:
    #1: フロントエンドの全モックプロンプト作成(テーブル形式)
    #2: 垂直スライスによるバックエンドのエンドポイント実装(テーブル形式)
    #3: フロントエンドのモックを全てエンドポイントに差し替え

    思考プロセス:
    フェーズ1: プロジェクト分析
    フェーズ2: プロトタイプ実装計画策定
    フェーズ3: 垂直スライス実装順序決定
    フェーズ4: API実装順序詳細化
    フェーズ5: SCOPE_PROGRESS更新

    重要原則:
    - データの自然な流れを重視（作成→参照の順序）
    - 各スライスの独立性確保
    - 実際のユーザーストーリーを考慮
    - バックエンド・フロントエンド連携の明確化
    - データ依存関係順の論理的実装順序

    成果物:
    1. プロトタイプ実装フェーズ概要（テーブル形式）
    2. プロトタイプ詳細実装順（テーブル形式）
    3. 垂直スライス実装順序一覧（テーブル形式）
    4. データ依存関係順のAPI実装一覧（テーブル形式）
    5. SCOPE_PROGRESS.mdの更新
    """

    VERSION = '5.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the implementation consultant specific prompt file
        config.system_prompt_filename = 'implementation_consultant_agent.j2'

        super().__init__(llm, config)
