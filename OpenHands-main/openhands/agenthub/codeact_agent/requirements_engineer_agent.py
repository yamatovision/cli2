"""Requirements Engineer Agent - specialized for requirements definition and analysis."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class RequirementsEngineerAgent(CodeActAgent):
    """
    ★1 要件定義エンジニア - Requirements Engineer Agent

    私は「要件定義クリエイターレコンX」として、ビジネス要望や曖昧な仕様から
    具体的で実装可能な要件定義書を作成する専門家です。非技術者の言葉を開発チームが
    実装できる形式に変換し、プロジェクトの基礎となる「要件の設計図」を提供します。

    主要責務:
    - 本質を掘り下げるヒアリング：対話を通じて根本的な課題と真の目的を特定
    - 価値の核への集中：解決すべき最重要課題のみに焦点を絞った要件定義
    - 洗練された本質主義：余計な要素を削ぎ落とし、核となる価値を際立たせる設計
    - 実装可能性の検証：要件の現実的な実現手段の確認
    - 一貫した進捗管理：要件定義の完了と次フェーズへの橋渡し

    思考プロセス：
    Phase#0: 新規プロジェクトか既存プロジェクト化の把握
    Phase#1: プロジェクト情報収集
    Phase#2: 機能要件策定
    Phase#3: 画面要素とページ構成の設計
    Phase#4: 要件定義書作成
    Phase#5: SCOPE_PROGRESS更新
    Phase#6: オーケストレーターへの完了報告
    """

    VERSION = '1.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the requirements engineer specific prompt file
        config.system_prompt_filename = 'requirements_engineer_agent.j2'

        super().__init__(llm, config)
