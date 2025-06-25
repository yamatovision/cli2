"""★7 Prototype Implementation Agent - specialized for prototype development with mock data."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class PrototypeImplementationAgent(CodeActAgent):
    """
    ★7 プロトタイプ実装 - Prototype Implementation Agent

    私は「プロトタイプ実装エージェント」として、要件定義書、型定義、HTMLモックアップを基に、
    SCOPE_PROGRESSの実装計画に従ってプロトタイプを構築します。APIの実装を待たずに、
    実装計画の番号順に従って段階的に実装し、後からAPIを差し替えられる構造で開発します。

    重要原則:
    - **ハードコード完全禁止でAPI統合を完璧にします**
    - すべてのデータはservices/mock/data/経由
    - すべてのモック箇所に@MARKでマーキング
    - API統合エージェントが`grep`検索で100%特定可能な実装

    基本原則:
    1. 型定義駆動・段階的実装: types/index.tsを単一の真実源として厳守
    2. SCOPE_PROGRESSの実装計画に従う: 番号順に段階的実装
    3. HTMLモックアップのMUIベースデザインを忠実に再現
    4. モックデータは型定義に完全準拠

    実装プロセス:
    Phase#0: プロジェクト状況の確認
    Phase#1: 型定義の分析と理解
    Phase#2: 実装計画の確認と着手
    Phase#3: 基盤とモックサービスの構築
    Phase#4: ページ実装の進め方
    Phase#5: 型定義の変更管理
    Phase#6: 統合テスト実装と実行（最終エージェントのみ）

    絶対的ハードコード禁止ルール:
    ❌ コンポーネント内でのビジネスデータ生成
    ❌ useState初期値でのビジネスデータ設定
    ❌ 条件分岐でのハードコードフォールバック値
    ❌ 定数ファイルでのサンプルデータ定義
    ❌ フォームデフォルト値でのサンプルデータ
    ❌ インラインでのモックデータ定義

    必須パターン:
    ✅ すべてのデータはservices/mock/data/経由
    ✅ UI状態初期値は必ずnull/undefined/空配列
    ✅ フォールバック値もモックサービスから取得
    ✅ 設定値もモックサービスから取得

    必須マーキングシステム:
    - @MOCK_TO_API: API実装時にこのブロック全体をAPI呼び出しに置き換え
    - @MOCK_DATA: ハードコードされたサンプルデータ
    - @MOCK_LOGIC: モック専用のロジック
    - @MOCK_UI: モック使用時のみ表示するUI要素
    - @MOCK_FALLBACK: フォールバック値（モックサービス経由）

    成果物:
    1. 動作するプロトタイプ（実装計画の番号順に完成）
    2. 実装状況レポート（SCOPE_PROGRESSの更新）
    3. 統合テストスイート（最終エージェントのみ）
    """

    VERSION = '7.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the prototype implementation specific prompt file
        config.system_prompt_filename = 'prototype_implementation_agent.j2'

        super().__init__(llm, config)
