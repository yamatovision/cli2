# BlueLampシステム実装指示書（5人分担版）

## 🎯 実装概要

OpenHandsにBlueLampシステムの残り13エージェントを実装します。
すでに4つのエージェント（Orchestrator、★1-3）は実装済みです。

**重要**: OpenHands_CLI_Analysis_Report.mdの「BlueLampシステム実装ガイド（完全版）」セクションを必ず参照してください。

---

## 👤 エージェント1への指示（3つ担当）

### 担当エージェント
- ★4 SystemArchitect（システムアーキテクト）
- ★5 ImplementationConsultant（実装計画コンサルタント）
- ★6 EnvironmentSetup（環境構築）

### 作業指示

1. **必須参照ファイル**
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands_CLI_Analysis_Report.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/04-system-architect.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/05-implementation-consultant.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/06-environment-setup.md`

2. **実装手順**
   ```bash
   # ディレクトリ作成
   cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/cli
   mkdir -p openhands/agenthub/system_architect/prompts
   mkdir -p openhands/agenthub/implementation_consultant/prompts
   mkdir -p openhands/agenthub/environment_setup/prompts
   ```

3. **各エージェントごとに3つのファイルを作成**
   - `{agent_name}.py` - メインクラスファイル
   - `__init__.py` - エージェント登録ファイル
   - `prompts/system_prompt.j2` - プロンプトファイル

4. **重要な注意事項**
   - privateディレクトリのプロンプトを**一字一句変更せずに完全コピペ**
   - system_prompt.j2の末尾に必ず `{{ instructions }}` を追加
   - クラス名は対応表通りに（SystemArchitect、ImplementationConsultant、EnvironmentSetup）

---

## 👤 エージェント2への指示（2つ担当）

### 担当エージェント
- ★7 PrototypeImplementation（プロトタイプ実装）
- ★8 BackendImplementation（バックエンド実装）

### 作業指示

1. **必須参照ファイル**
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands_CLI_Analysis_Report.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/07-prototype-implementation.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/08-backend-implementation.md`

2. **実装手順**
   ```bash
   # ディレクトリ作成
   cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/cli
   mkdir -p openhands/agenthub/prototype_implementation/prompts
   mkdir -p openhands/agenthub/backend_implementation/prompts
   ```

3. **重要な注意事項**
   - プロンプトファイルは完全コピペ（改行、スペース、絵文字もすべて同じに）
   - ファイル構造は既存の実装済みエージェント（requirements_engineer等）を参考に

---

## 👤 エージェント3への指示（3つ担当）

### 担当エージェント
- ★9 TestQualityVerification（テスト品質検証）
- ★10 APIIntegration（API統合）
- ★11 DebugDetective（デバッグ探偵）

### 作業指示

1. **必須参照ファイル**
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands_CLI_Analysis_Report.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/09-test-quality-verification.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/10-api-integration.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/11-debug-detective.md`

2. **実装手順**
   ```bash
   # ディレクトリ作成
   cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/cli
   mkdir -p openhands/agenthub/test_quality_verification/prompts
   mkdir -p openhands/agenthub/api_integration/prompts
   mkdir -p openhands/agenthub/debug_detective/prompts
   ```

3. **クラス名対応**
   - TestQualityVerification
   - APIIntegration
   - DebugDetective

---

## 👤 エージェント4への指示（3つ担当）

### 担当エージェント
- ★12 DeploySpecialist（デプロイスペシャリスト）
- ★13 GitHubManager（GitHubマネージャー）
- ★14 TypeScriptManager（TypeScriptマネージャー）

### 作業指示

1. **必須参照ファイル**
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands_CLI_Analysis_Report.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/12-deploy-specialist.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/13-github-manager.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/14-typescript-manager.md`

2. **実装手順**
   ```bash
   # ディレクトリ作成
   cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/cli
   mkdir -p openhands/agenthub/deploy_specialist/prompts
   mkdir -p openhands/agenthub/github_manager/prompts
   mkdir -p openhands/agenthub/typescript_manager/prompts
   ```

3. **特記事項**
   - TypeScriptManagerは共通サービスとして頻繁に呼ばれる重要なエージェント

---

## 👤 エージェント5への指示（2つ担当 + 統合作業）

### 担当エージェント
- ★15 FeatureExtension（機能拡張）
- ★16 RefactoringExpert（リファクタリングエキスパート）

### 作業指示

1. **必須参照ファイル**
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands_CLI_Analysis_Report.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/15-feature-expansion.md`
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/private/16-refactoring-expert.md`

2. **実装手順**
   ```bash
   # ディレクトリ作成
   cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/cli
   mkdir -p openhands/agenthub/feature_extension/prompts
   mkdir -p openhands/agenthub/refactoring_expert/prompts
   ```

3. **統合作業（重要）**
   - すべてのエージェント実装後、`openhands/agenthub/__init__.py`を更新
   - 17個すべてのエージェントをインポートし、__all__リストに追加
   - 最終的な動作確認を実施

---

## 🚨 全員共通の重要事項

1. **プロンプトの完全コピペ**
   - privateディレクトリの.mdファイルから一字一句変更せずにコピー
   - 特に改行、インデント、表、絵文字に注意
   - 必ずファイル末尾に `{{ instructions }}` を追加

2. **ファイル構造**
   ```
   openhands/agenthub/{agent_name}/
   ├── __init__.py
   ├── {agent_name}.py
   └── prompts/
       └── system_prompt.j2
   ```

3. **既存実装の参考**
   - `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/cli/openhands/agenthub/requirements_engineer/`
   - このディレクトリの構造を完全に真似る

4. **テスト方法**
   ```python
   from openhands.controller.agent import Agent
   print(Agent.list_agents())
   # 自分が実装したエージェント名が表示されることを確認
   ```

5. **エラーが出た場合**
   - インポートパスの確認
   - クラス名とファイル名の一致確認
   - プロンプトファイルの{{ instructions }}確認

全員、OpenHands_CLI_Analysis_Report.mdの実装ガイドを熟読してから作業を開始してください。