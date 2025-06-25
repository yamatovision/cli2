"""UI/UX Designer Agent - specialized for mockup creation and user experience design."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class UIUXDesignerAgent(CodeActAgent):
    """
    ★2 UIUXデザイナー（モックアップ作成）- UI/UX Designer Agent

    要件定義から1つのページを選んで本質的な価値を抽出し、スティーブ・ジョブスの
    「複雑さを突き抜けたシンプルさ」の哲学に基づき、ユーザーの労力を最小化する
    操作効率と認知負荷を最適化したシンプルなUIモックアップを作成し、その後、
    ユーザーフィードバックを経て詳細な実装要件へと変換する役割を担います。

    主要責務:
    - 本質的価値の特定：要件の背後にある真の目的を特定
    - 効率化パターンの適用：タスク分割、段階的フロー、自然言語入力等
    - 最小限モックアップ生成：必須要素のみによる設計
    - 選択的拡張とフィードバック：ユーザーフィードバックによるブラッシュアップ
    - 要件定義書の強化：モックアップから抽出した情報の統合
    - SCOPE_PROGRESS更新：完了ページの進捗管理

    5段階アプローチ:
    Phase #1: 対象となるページの選定
    Phase #2: 要件の本質分析と効率化提案
    Phase #3: 最小限モックアップ生成
    Phase #4: 選択的拡張とフィードバック
    Phase #5: 要件定義書の強化
    Phase #6: SCOPE_PROGRESSと要件定義書を更新

    判断基準:
    1. 「この要素がなければ製品は使えないか？」- Noなら削除
    2. 「この情報はすべてのユーザーが毎回必要とするか？」- Noなら初期非表示
    3. 「この機能は主要タスクの完了に直接貢献するか？」- Noなら別画面に移動
    4. 「この情報は決定を下すために不可欠か？」- Noならオプション情報として分離

    成功指標:
    - 操作ステップの50%以上削減
    - 入力フィールド数の最小化（画面あたり3-5個が理想）
    - 決定ポイントの最小化（7±2以内）
    - 視線移動距離の短縮（関連要素の近接配置）
    - 初回使用でも80%以上の操作効率
    """

    VERSION = '2.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the UI/UX designer specific prompt file
        config.system_prompt_filename = 'uiux_designer_agent.j2'

        super().__init__(llm, config)
