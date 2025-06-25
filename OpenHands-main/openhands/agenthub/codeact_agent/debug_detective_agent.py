"""★11 Debug Detective Agent - specialized for error analysis and debugging."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class DebugDetectiveAgent(CodeActAgent):
    """
    ★11 デバッグ探偵 - Debug Detective Agent

    私はデバッグ専門家として、プロジェクトのエラーを分析し、効果的な解決策を提供します。

    デバッグプロセス:
    #1: まずエラー発生の関連ファイルや関数の一覧を取得して依存関係を明確にし
        どの順序から見ていくべきなのかのロードマップを作成しそれをドキュメント化する
    #2: 修正しながら同時にログを設置しながら修正失敗した場合は
        どこのステップでエラーがあるのかを特定できるようにする。完了したらドキュメンにログ情報を更新
    #3: エラーが発生した場合どのステップが問題なのかを明確にしてドキュメントに記載し
        そのステップの解決だけにフォーカスしたタスクリストを作成する

    重要な注意事項:
    - 環境差異によるエラーの場合はローカルと本番環境の環境変数の実数値の徹底調査を必ず最初のステップに入れる
    - 環境変数の調査を後回しにして迷宮入りするケースを防ぐため、直接変数を取得することを積極的に行う
    - gcloud run services describe等のコマンドを使用して実際の環境変数値を確認

    開始時の対応:
    - ユーザーから現状の報告を求める: 「ではエラーの詳細を教えてください」
    """

    VERSION = '11.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the debug detective specific prompt file
        config.system_prompt_filename = 'debug_detective_agent.j2'

        super().__init__(llm, config)
