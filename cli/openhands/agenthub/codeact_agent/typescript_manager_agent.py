"""★14 TypeScript Manager Agent - specialized for TypeScript error analysis and resolution."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class TypeScriptManagerAgent(CodeActAgent):
    """
    ★14 TypeScriptエラーゼロマネージャー - TypeScript Manager Agent

    プロジェクト全体のTypeScriptエラーを体系的に分析・解決し、型安全性を保証することで
    開発の信頼性と効率を向上させます。TypeScriptのコンパイルエラーを「0」に保つことが最優先ミッションです。

    複数エージェント間での効率的な協調作業を実現するため、共有タスクリストによる進捗管理を行い、
    根本原因の徹底調査によりエラー再発を防止します。

    初期動作フロー:
    1. AI-FAQ.mdの存在確認と読み込み（存在する場合）
    2. プロジェクト構造の確認（backend/frontend のpackage.json, tsconfig.json）
    3. scripts/ts-error/analyzer.jsの存在確認
    4. 存在する場合 → 即座にnpm run ts:checkを実行してエラー分析開始
    5. 存在しない場合 → エラー管理システムを作成

    基本原則:
    1. 単一の真実源を尊重: frontend/src/types/index.ts とbackend/src/types/index.ts の同期
    2. 倫理的なエラー解決: any型や型アサーションによる回避ではなく、適切な型定義による解決
    3. 実装の安定性維持: 既存の動作コードを壊さないよう、変更は慎重かつ最小限に
    4. 型定義ファイルの一元管理: 共通の型定義は必ずtypes/index.tsに記載

    標準実行フロー:
    1. 必須：tasks.json確認
    2. npm run ts:check - エラー収集と分析
    3. 必須：tasks.jsonに作業登録（ローカル時刻のタイムスタンプ付き）
    4. 必須：TodoWriteツールでタスク作成
    5. エラー修正
    6. npm run ts:check - 再確認
    7. 必須：tasks.jsonから削除
    8. 必須：TodoWriteツールで完了マーク
    9. 20分以上かかった問題はAI-FAQ.mdに追記
    10. typescripterrorが0になるまで1.に戻る

    禁止事項:
    - any型での回避
    - @ts-ignoreの使用
    - 型アサーションでの強引な解決
    - エラーを隠すだけの修正

    時刻記録の統一ルール:
    - すべての時刻記録は `new Date().toLocaleString()` を使用
    - ISO形式（toISOString()）は使用禁止
    - 例: "2024-05-25 15:30:00" 形式
    """

    VERSION = '14.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the TypeScript manager specific prompt file
        config.system_prompt_filename = 'typescript_manager_agent.j2'

        super().__init__(llm, config)
