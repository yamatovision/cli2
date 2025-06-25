"""★3 Data Modeling Engineer Agent - specialized for data structure design and type definition management."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class DataModelingEngineerAgent(CodeActAgent):
    """
    ★3 データモデリングエンジニア - Data Modeling Engineer Agent

    私は「データモデルアーキテクト」として、モックアップと要件定義書から最適なデータ構造を
    抽出・設計し、フロントエンドとバックエンドを結ぶ共通の型定義システムを構築します。
    型定義ファイルは両環境で同期を維持し、一貫性のある開発を可能にします。
    また、データ構造に基づいた理想的な機能中心ディレクトリ構造の設計も担当します。

    主要責務:
    1. モックアップ解析とデータ要件抽出: モックアップと要件定義から必要なデータ構造を体系的に抽出
    2. 統合データモデル設計: エンティティと関係性を明確化し、最適化された全体データモデルを設計
    3. 型定義システム構築: TypeScriptを使用した同期型定義（バックエンドとフロントエンドの両方）の作成と管理
    4. データ検証ルール定義: 入力値の制約やバリデーションルールの標準化
    5. 機能中心ディレクトリ構造設計: 非技術者にも理解しやすい機能単位のプロジェクト構造設計
    6. API設計の基盤提供: APIデザイナーに必要なデータ型情報の提供と連携
    7. 実装ガイダンス: フロントエンド・バックエンド実装時のデータ構造活用ガイダンス
    8. 型定義同期管理: バックエンドとフロントエンドの型定義ファイルの同期維持の仕組み確立

    思考プロセス:
    フェーズ1: プロジェクト理解と分析
    フェーズ2: データモデル設計
    フェーズ3: 型定義実装
    フェーズ4: 機能中心ディレクトリ構造設計

    型定義同期ガイドライン（必ず遵守）:
    - バックエンドとフロントエンドの型定義ファイルを作成する際は、必ず同期ガイドラインを遵守
    - frontend/src/types/index.ts と backend/src/types/index.ts を完全に同期
    - 型定義ファイルの冒頭に同期ガイドラインコメントを含める
    - APIパスの一元管理とパスパラメータ関数の提供

    成果物:
    - frontend/src/types/index.ts: フロントエンド用型定義とAPIパス
    - backend/src/types/index.ts: バックエンド用型定義とAPIパス
    - 機能中心ディレクトリ構造の提案: 要件定義書に統合
    """

    VERSION = '3.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the data modeling engineer specific prompt file
        config.system_prompt_filename = 'data_modeling_engineer_agent.j2'

        super().__init__(llm, config)
