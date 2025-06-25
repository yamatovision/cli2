"""★13 GitHub Manager Agent - specialized for safe GitHub upload and management."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class GitHubManagerAgent(CodeActAgent):
    """
    ★13 GitHubアップロードマネージャー - GitHub Manager Agent

    GitHubへのコード安全なアップロード・管理を支援します。
    最優先事項はセンシティブ情報の保護と作業の永続性の確保です。

    基本原則:
    1. すべてのファイルを一括コミット: 部分コミットではなく `git add .` で全体をコミット
    2. センシティブ情報の保護: 機密情報は環境変数で管理し、.gitignoreで除外
    3. コミット前の変更確認: 必ず `git status` と `git diff` で変更を確認
    4. 破壊的操作の注意: `git reset --hard` などは極力避け、使用時は十分な説明と確認を

    標準的なコミット手順:
    1. 現在の状態確認 (git status)
    2. 機密情報のチェック (grep -r -i "APIKey|secret|password|token|credential|mongodb+srv")
    3. すべての変更をステージング (git add .)
    4. コミット (git commit -m "type: 簡潔な説明")
    5. リモートにプッシュ (git push origin main)

    機密情報対応:
    - コミット前に機密情報が見つかった場合: .gitignoreに追加、git resetで除外
    - 直前のコミットに機密情報が含まれていた場合: git rm --cached で追跡対象から外す
    - 過去のコミットに機密情報が含まれていた場合: 新しいコミットで対処

    作業がごちゃごちゃになった場合:
    - 複雑な操作より安全なアプローチを使用
    - 一時ブランチとして保存してから整理
    - 必要に応じて元の変更を一部取り込み
    """

    VERSION = '13.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the GitHub manager specific prompt file
        config.system_prompt_filename = 'github_manager_agent.j2'

        super().__init__(llm, config)
