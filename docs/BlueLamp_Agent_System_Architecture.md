# BlueLampエージェントシステム アーキテクチャ詳細仕様書

## 🏗️ エージェントアーキテクチャ概要

### エージェント継承構造
```
CodeActAgent（基底クラス）
    ├── OrchestrationAgent（親エージェント/永続的調整役）
    └── 各専門エージェント（サブエージェント）
        ├── RequirementsEngineerAgent
        ├── UIUXDesignerAgent
        ├── DataModelingEngineerAgent
        ├── SystemArchitectAgent
        ├── ImplementationConsultantAgent
        ├── EnvironmentSetupAgent
        ├── PrototypeImplementationAgent
        ├── BackendAgent
        ├── TestQualityVerificationAgent
        ├── APIIntegrationAgent
        ├── DebugDetectiveAgent
        ├── DeploySpecialistAgent
        ├── GitHubManagerAgent
        ├── TypeScriptManagerAgent
        ├── FeatureExpansionAgent
        └── RefactoringExpertAgent
```

### 階層型制御フロー
```
ユーザー入力
    ↓
OrchestrationAgent（RUNNING状態を維持）
    ↓ [DelegateTool使用]
専門エージェント（タスク実行）
    ↓ [FinishTool使用]
OrchestrationAgent（制御を取り戻し継続）
    ↓
次のフェーズ判断...
```

## 📊 システムプロンプト構成要素の詳細

### 1. プロンプトファイル階層

| レイヤー | ファイル/ディレクトリ | 役割 | 読み込みタイミング |
|---------|-------------------|------|----------------|
| **基盤層** | `/cli/openhands/agenthub/codeact_agent/prompts/system_prompt.j2` | 全エージェント共通の基本テンプレート | エージェント初期化時 |
| **共通テンプレート層** | `/cli/openhands/agenthub/codeact_agent/prompts/additional_info.j2` | リポジトリ情報、ランタイム情報、会話指示を動的挿入 | プロンプト生成時 |
| | `/cli/openhands/agenthub/codeact_agent/prompts/microagent_info.j2` | キーワードマッチに基づく追加情報（現在アクティブ） | RecallObservation処理時 |
| | `/cli/openhands/agenthub/codeact_agent/prompts/user_prompt.j2` | ユーザープロンプト用（現在は空） | プロンプト生成時 |
| **エージェント固有層** | `/cli/openhands/agenthub/codeact_agent/prompts/{agent_name}.j2` | 各エージェント専用プロンプト | エージェント初期化時 |
| **プロジェクト層** | `/.openhands_instructions` | プロジェクト固有の指示（レガシーサポート） | ワークスペース読み込み時 |
| | `/.openhands/microagents/` | プロジェクト固有のmicroagents | ワークスペース読み込み時 |

### 2. エージェント別プロンプトファイル一覧

| エージェント名 | クラス名 | プロンプトファイル | 役割 |
|-------------|---------|----------------|------|
| **親エージェント** |
| オーケストレーター | OrchestrationAgent | `orchestration_agent.j2` | 全体調整・委譲管理・永続的制御 |
| **サブエージェント（16専門家）** |
| 要件定義エンジニア | RequirementsEngineerAgent | `requirements_engineer_agent.j2` | 要件定義・スコープ明確化 |
| UIUXデザイナー | UIUXDesignerAgent | `uiux_designer_agent.j2` | UI/UXデザイン・モックアップ作成 |
| データモデリング | DataModelingEngineerAgent | `data_modeling_engineer_agent.j2` | データベース設計・データモデリング |
| システムアーキテクト | SystemArchitectAgent | `system_architect_agent.j2` | システム全体のアーキテクチャ設計 |
| 実装計画 | ImplementationConsultantAgent | `implementation_consultant_agent.j2` | 実装計画・開発戦略策定 |
| 環境構築 | EnvironmentSetupAgent | `environment_setup_agent.j2` | 開発環境構築・設定 |
| プロトタイプ | PrototypeImplementationAgent | `prototype_implementation_agent.j2` | プロトタイプ実装・POC開発 |
| バックエンド | BackendAgent | `backend_agent.j2` | バックエンド開発・API実装・DB操作 |
| テスト品質 | TestQualityVerificationAgent | `test_quality_verification_agent.j2` | テスト実装・品質保証 |
| API統合 | APIIntegrationAgent | `api_integration_agent.j2` | API統合・フロントバック連携 |
| デバッグ探偵 | DebugDetectiveAgent | `debug_detective_agent.j2` | バグ調査・修正 |
| デプロイ | DeploySpecialistAgent | `deploy_specialist_agent.j2` | デプロイメント・インフラ構築 |
| GitHub管理 | GitHubManagerAgent | `github_manager_agent.j2` | GitHub操作・バージョン管理 |
| TypeScript | TypeScriptManagerAgent | `typescript_manager_agent.j2` | TypeScript型エラー解決 |
| 機能拡張 | FeatureExpansionAgent | `feature_expansion_agent.j2` | 新機能追加・拡張 |
| リファクタリング | RefactoringExpertAgent | `refactoring_expert_agent.j2` | コードリファクタリング・最適化 |

## 🛠️ ツール構成の詳細

### 利用可能なツール一覧

| ツール名 | クラス/関数 | 設定フラグ | 機能 | デフォルト値 |
|---------|-----------|-----------|------|-----------|
| **Bashツール** | `create_cmd_run_tool()` | `enable_cmd` | シェルコマンド実行 | `true` |
| **エディタツール** | `create_str_replace_editor_tool()` | `enable_editor` | ファイル編集（文字列置換） | `true` |
| **LLMエディタ** | `LLMBasedFileEditTool` | `enable_llm_editor` | LLMベースの高度な編集 | `false` |
| **ブラウザツール** | `BrowserTool` | `enable_browsing` | Webブラウザ操作 | `true` |
| **Jupyterツール** | `IPythonTool` | `enable_jupyter` | Python/Jupyter実行 | `true` |
| **委譲ツール** | `DelegateTool` | `enable_delegate` | 他エージェントへの委譲 | `true` |
| **思考ツール** | `ThinkTool` | `enable_think` | 思考整理・計画 | `true` |
| **完了ツール** | `FinishTool` | `enable_finish` | タスク完了報告 | `true` |
| **MCPツール** | 動的追加 | `enable_mcp` | Model Context Protocol経由の外部ツール | `true` |

### エージェント別ツール配分（実装済み）

| エージェント種別 | enable_delegate | enable_finish | 利用可能な主要ツール |
|----------------|-----------------|---------------|-------------------|
| **OrchestrationAgent** | `true` | `false` | Delegate（16専門エージェント選択）+ 基本ツール |
| **16専門エージェント** | `false` | `true` | Finish（オーケストレーターに復帰）+ 基本ツール |

## 🔄 ツール情報の処理フロー

### 1. ツール情報の生成と注入

```
1. CodeActAgent._get_tools() でツールリスト生成
   - AgentConfigの enable_* フラグに基づいて条件付き追加
   ↓
2. Agent.get_system_message() でSystemMessageAction生成
   - contentにシステムプロンプト
   - toolsにツールリスト
   - agent_classにエージェント名
   ↓
3. LLM呼び出し時
   - params['tools'] = check_tools(self.tools, self.llm.config)
   - ChatCompletionToolParam形式でLLMに送信
```

### 2. FinishToolによる制御復帰メカニズム

```
1. サブエージェントがFinishTool実行
   ↓
2. function_calling.pyでAgentFinishActionに変換
   ↓
3. agent_controller.pyで処理
   - サブエージェント状態: RUNNING → FINISHED
   ↓
4. 親コントローラー（オーケストレーター）が検知
   - on_event()でデリゲート状態をチェック
   - FINISHEDを検出してend_delegate()実行
   ↓
5. 制御がオーケストレーターに復帰
   - オーケストレーター状態: RUNNINGを維持
   - AgentDelegateObservationで結果受信
   - 次のフェーズ判断・実行継続
```

## 📝 親エージェントとサブエージェントの詳細比較

| 項目 | 親エージェント（Orchestration） | サブエージェント |
|------|------------------------------|---------------|
| **基底クラス** | CodeActAgent | CodeActAgent |
| **プロンプトファイル** | `orchestration_agent.j2` | 各専門分野用の個別プロンプト |
| **DelegateTool** | ✅ 有効（16専門エージェントへ委譲可能） | ❌ 無効 |
| **FinishTool** | ❌ 無効（永続的に動作） | ✅ 有効（オーケストレーターに復帰） |
| **状態遷移** | 常にRUNNING状態を維持 | RUNNING → FINISHED（タスク完了時） |
| **役割** | タスク分解・調整・統括・進捗管理 | 専門領域での実装・分析・実行 |
| **委譲設定（未実装）** | `orchestration_can_delegate_to = [全エージェント]` | `{agent}_can_delegate_to = ["orchestration"]` |

## 🔧 設定ファイル構造（agent_configs.toml）

### オーケストレーター設定
```toml
[agents.orchestration]
name = "OrchestrationAgent"
classpath = "openhands.agenthub.codeact_agent.codeact_agent:CodeActAgent"
system_prompt_filename = "orchestration_agent.j2"
description = "全体調整・委譲管理を担当"
enable_delegate = true   # 16専門エージェントへの委譲を有効化
enable_finish = false    # 終了ツールを無効化（永続的動作）
```

### 専門エージェント設定（例：BackendAgent）
```toml
[agents.backend]
name = "BackendAgent"
classpath = "openhands.agenthub.codeact_agent.backend_agent:BackendAgent"
system_prompt_filename = "backend_agent.j2"
description = "バックエンド開発、API実装、データベース操作を担当"
enable_delegate = false  # 他エージェントへの委譲を無効化
enable_finish = true     # オーケストレーターへの復帰を有効化
```

## 📍 共通ルール追加の推奨方法

### 方法1: 共通テンプレート作成
```
1. /cli/openhands/agenthub/codeact_agent/prompts/common_rules.j2 を作成
2. system_prompt.j2 に {% include 'common_rules.j2' %} を追加
```

### 方法2: .openhands_instructions 活用
```
1. プロジェクトルートに .openhands_instructions ファイルを配置
2. 全エージェントが自動的に読み込む
```

### 方法3: Microagents 活用（要frontmatter設定）
```yaml
---
name: common-rules
type: knowledge
triggers:
  - "SCOPE_PROGRESS"
  - "進捗管理"
---

# 共通ルール内容
```

## 🎯 システムの特徴と利点

### 1. **シンプルな階層構造**
- オーケストレーター：永続的な調整役（Delegate専用）
- 専門エージェント：タスク実行と復帰（Finish専用）
- 役割が明確で混乱がない

### 2. **効率的なコンテキスト管理**
- 各エージェントは必要最小限のツールのみ保持
- DelegateToolの詳細説明はオーケストレーターのみ
- コンテクストウィンドウの無駄遣いを防止

### 3. **自然な制御フロー**
- FinishToolでRUNNING状態のオーケストレーターに復帰
- 16フェーズの連続的な実行が可能
- デッドロックや無限ループのリスクなし

### 4. **拡張性と保守性**
- 新しい専門エージェントの追加が容易
- 設定ファイルで動作を一元管理
- プロンプトとツール構成の分離

## 🚀 今後の改善可能性

1. **delegation_rulesの実装**
   - 現在は設定のみで実際の制御は未実装
   - DelegateToolで動的にエージェントリストを制御可能

2. **Microagentsの活用**
   - frontmatter追加で知識注入を有効化
   - トリガーベースの動的情報提供

3. **プロジェクト完了機能**
   - オーケストレーター用の特別な完了メカニズム
   - 16フェーズ完了後の終了処理

BlueLampシステムは、**明確な役割分担**と**シンプルな制御フロー**により、複雑なプロジェクトを効率的に管理できる設計となっています。

---

## 🚨 緊急対応：ESCキー即時応答の実装プラン

### 問題の現状

現在のOpenHandsシステムでは、LLM呼び出し中（10-30秒）にESCキーを押しても即座に処理が中止されません。これは以下の理由によります：

```
現在の処理フロー：
AgentController._step() 
→ Agent.step(state) 
→ LLM.completion(**params) [30秒間完全ブロック]
→ ModelResponse

問題：LLM応答待ち中は割り込みチェックが一切行われない
```

### 既存のESCキー処理

OpenHandsには既にESCキーでエージェントを一時停止する機能が実装されています（`tui.py:582-612`）。しかし、LLM呼び出し中は即座に反応しません。

### 解決策の選択：非同期ポーリング方式（推奨）

最小限の変更で最大の効果を得られる実装方式です。

## 📋 実装プラン詳細

### フェーズ1：基盤整備（即時対応可能）

#### 1.1 LLMクラスの拡張

**変更ファイル**: `/cli/openhands/llm/llm.py`

```python
# 追加する機能
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from openhands.utils.shutdown_listener import should_exit
from openhands.core.exceptions import UserCancelledError

class LLM:
    def __init__(self, ...):
        # 既存のコード
        self._cancellation_event = threading.Event()
        self._enable_interruption = True  # 設定で制御可能
    
    def _start_cancellation_monitor(self):
        """別スレッドで割り込み監視を開始"""
        def monitor():
            while not self._cancellation_event.is_set():
                if should_exit():
                    self._cancellation_event.set()
                    break
                time.sleep(0.1)  # 100ms間隔でチェック
        
        monitor_thread = threading.Thread(target=monitor, daemon=True)
        monitor_thread.start()
        return monitor_thread
    
    def completion(self, *args, **kwargs):
        """既存のcompletionメソッドを拡張（後方互換性維持）"""
        if not self._enable_interruption:
            return self._completion_unwrapped(*args, **kwargs)
        
        return self._completion_with_interruption(*args, **kwargs)
    
    def _completion_with_interruption(self, *args, **kwargs):
        """割り込み可能なcompletion"""
        self._cancellation_event.clear()
        monitor_thread = self._start_cancellation_monitor()
        
        try:
            # 既存のcompletionをFutureで実行
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self._completion_unwrapped, *args, **kwargs)
                
                # 100ms間隔で割り込みチェック
                while not future.done():
                    if self._cancellation_event.is_set():
                        raise UserCancelledError("LLM request cancelled by user")
                    time.sleep(0.1)
                
                return future.result()
                
        except UserCancelledError:
            self.logger.info("LLM request cancelled by user")
            raise
        finally:
            self._cancellation_event.set()
```

#### 1.2 設定による制御

**変更ファイル**: `/cli/openhands/core/config.py`

```python
# AgentConfigクラスに追加
class AgentConfig:
    # 既存の設定...
    
    # 割り込み制御設定
    enable_interruption: bool = True
    interruption_check_interval: float = 0.1  # 100ms
    interruption_timeout: float = 300.0  # 5分でタイムアウト
```

#### 1.3 AgentControllerでの統合

**変更ファイル**: `/cli/openhands/controller/agent_controller.py`

```python
# _stepメソッドの拡張
async def _step(self) -> None:
    try:
        # 既存のコード...
        
        # 割り込みチェックを追加
        if should_exit():
            raise UserCancelledError("Agent step cancelled by user")
        
        action = self.agent.step(self.state)
        
        # 既存のコード...
        
    except UserCancelledError:
        self.log('info', 'Agent step cancelled by user')
        await self.set_agent_state_to(AgentState.STOPPED)
        return
    except Exception as e:
        # 既存のエラーハンドリング...
```

### フェーズ2：段階的拡張

#### 2.1 エージェントクラスでの対応

**変更ファイル**: `/cli/openhands/agenthub/codeact_agent/codeact_agent.py`

```python
class CodeActAgent:
    def __init__(self, llm: LLM, config: AgentConfig):
        # 既存のコード...
        
        # LLMに割り込み設定を適用
        if hasattr(llm, '_enable_interruption'):
            llm._enable_interruption = config.enable_interruption
            llm._check_interval = config.interruption_check_interval
```

#### 2.2 各専門エージェントでの設定

**変更ファイル**: `/cli/agent_configs.toml`

```toml
# 全エージェントに共通設定を追加
[agents.default]
enable_interruption = true
interruption_check_interval = 0.1
interruption_timeout = 300.0

# オーケストレーターは長時間実行のため設定調整
[agents.orchestration]
interruption_timeout = 1800.0  # 30分

# その他の設定は既存のまま...
```

### フェーズ3：最適化と監視

#### 3.1 ログ強化

```python
# openhands/core/logger.py への追加
def log_interruption_event(agent_name: str, llm_call_duration: float):
    logger.info(
        f"🛑 USER INTERRUPTION: {agent_name} LLM call cancelled after {llm_call_duration:.1f}s",
        extra={
            'msg_type': 'USER_INTERRUPTION',
            'agent_name': agent_name,
            'duration': llm_call_duration
        }
    )
```

#### 3.2 メトリクス追跡

```python
# openhands/core/metrics.py への追加
class Metrics:
    def __init__(self):
        # 既存のメトリクス...
        self.interruption_count = 0
        self.avg_interruption_time = 0.0
    
    def record_interruption(self, duration: float):
        self.interruption_count += 1
        # 平均時間を更新...
```

## 🎯 実装スケジュール

### Week 1: 緊急対応
- [x] LLM.completionに割り込み機能追加
- [x] AgentControllerでUserCancelledError処理
- [x] 基本的な設定項目追加

### Week 2: 統合テスト
- [ ] 全16エージェントでの動作確認
- [ ] エラーハンドリングの強化
- [ ] パフォーマンス調整

### Week 3: 最適化
- [ ] ログとメトリクス強化
- [ ] ドキュメント更新
- [ ] ユーザビリティ向上

## 🧪 テスト計画

### 単体テスト
```python
# tests/unit/test_llm_interruption.py
def test_llm_interruption():
    llm = LLM(config=test_config)
    
    # 割り込みシグナルをシミュレート
    def interrupt_after_delay():
        time.sleep(0.5)
        set_should_exit(True)
    
    thread = threading.Thread(target=interrupt_after_delay)
    thread.start()
    
    with pytest.raises(UserCancelledError):
        llm.completion(messages=[...])
```

### 統合テスト
```python
# tests/integration/test_agent_interruption.py
def test_orchestrator_interruption():
    controller = AgentController(
        agent=OrchestrationAgent(...),
        config=test_config
    )
    
    # 長時間タスクを開始
    controller.add_event(MessageAction("複雑なWebアプリを作って"))
    
    # 2秒後に割り込み
    time.sleep(2)
    send_sigint()
    
    # 適切に停止することを確認
    assert controller.get_agent_state() == AgentState.STOPPED
```

## 🔧 互換性保証

### 後方互換性
- デフォルト設定では従来通りの動作
- `enable_interruption = false`で旧動作に戻せる
- 既存のエージェントは無変更で動作

### 段階的移行
1. **デフォルト無効**でリリース
2. **ベータ版**でオプトイン有効
3. **安定版**でデフォルト有効

## 📊 期待される効果

### ユーザビリティ向上
- Ctrl+C押下から**0.1秒以内**での応答
- 長時間実行タスクの安全な中止
- ユーザーストレスの大幅軽減

### 開発効率向上
- デバッグ時の迅速な処理停止
- テスト実行の柔軟な制御
- CI/CDパイプラインでの安全な停止

## ⚠️ 注意事項

### 制限事項
- LLM APIコール中の0.1秒間隔でのチェック
- わずかなCPUオーバーヘッド（<1%）
- ネットワークタイムアウトは既存設定に依存

### 運用考慮事項
- 割り込み頻度の監視
- 不完全な処理状態の適切なクリーンアップ
- 長時間実行タスクでの適切なチェックポイント

この実装により、BlueLampシステムの**ユーザビリティが劇的に向上**し、開発者にとって使いやすいシステムになります。