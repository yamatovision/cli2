# 機能拡張計画: APIプロンプト取得システム & セッション切り替えエージェント 2025-01-05

## 1. 拡張概要

既存のOpenHandsシステムに、プロンプトをAPIから動的に取得する機能と、セッション内でのエージェント切り替え機能を追加します。これにより、16種類の専門エージェントによる協調システムを実現し、構築フェーズと機能拡張フェーズの効率的な管理を可能にします。

## 2. 詳細仕様

### 2.1 現状と課題

**現在の実装状況**：
- プロンプトはローカルファイル（.j2テンプレート）から読み込み
- エージェント切り替えには新セッション開始が必要
- 16エージェント協調システムの基盤が未実装
- 権限委譲機能は存在するが、複雑な委譲チェーン管理が困難

**課題**：
- プロンプトの動的更新ができない
- セッション継続性を保ったエージェント切り替えが不可能
- 構築フェーズと機能拡張フェーズの管理が非効率

### 2.2 拡張内容

**APIプロンプト取得システム**：
- 既存APIサービスから18種類のプロンプトを動的取得
- APIキー認証による安全なアクセス
- `@lru_cache()`によるキャッシュ機能
- API失敗時のデフォルトプロンプトフォールバック

**セッション切り替えエージェントシステム**：
- 3つの管理エージェント（ConstructionDelegationAgent、ExtensionDelegationAgent、SessionSwitchAgent）
- 16種類の専門エージェント（★1〜★16）
- セッション状態を保持したエージェント切り替え
- DelegationManagerAgent（親）→SpecialistAgent→DelegationManagerAgent（親）パターンの実装

## 3. ディレクトリ構造

```
openhands/agenthub/
├── shared/
│   ├── prompt_client.py             # 共通のAPIクライアント
│   ├── models/
│   │   ├── __init__.py
│   │   └── prompt_config.py         # プロンプト設定モデル
│   └── __init__.py
│
├── delegation_manager_agent/
│   ├── __init__.py
│   ├── construction_delegation_agent.py    # 構築フェーズ管理
│   ├── extension_delegation_agent.py       # 機能拡張フェーズ管理
│   └── prompts/
│       ├── construction_system.j2          # デフォルトプロンプト
│       └── extension_system.j2             # デフォルトプロンプト
│
├── session_switch_agent/
│   ├── __init__.py
│   ├── session_switch_agent.py
│   └── prompts/
│       └── session_switch_system.j2        # デフォルトプロンプト
│
└── specialist_agents/
    ├── __init__.py
    ├── specialist_agent.py                 # 16エージェント共通実装
    └── prompts/
        ├── agent_01_requirements.j2        # ★1要件定義エンジニア
        ├── agent_02_ui_design.j2           # ★2UI/UXデザイナー
        ├── agent_03_data_modeling.j2       # ★3データモデリングエンジニア
        ├── agent_04_architect.j2           # ★4システムアーキテクト
        ├── agent_05_implementation.j2      # ★5実装コンサルタント
        ├── agent_06_environment.j2         # ★6環境構築
        ├── agent_07_prototype.j2           # ★7プロトタイプ実装
        ├── agent_08_backend.j2             # ★8バックエンド実装
        ├── agent_09_test.j2                # ★9テスト品質検証
        ├── agent_10_api_integration.j2     # ★10API統合
        ├── agent_11_debug.j2               # ★11デバッグ探偵
        ├── agent_12_deploy.j2              # ★12デプロイスペシャリスト
        ├── agent_13_git.j2                 # ★13GitHubマネージャー
        ├── agent_14_typescript.j2          # ★14TypeScriptマネージャー
        ├── agent_15_feature.j2             # ★15機能拡張
        └── agent_16_refactor.j2            # ★16リファクタリングエキスパート
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: 影響なし（CLIベースの機能追加）
- **バックエンド**: 新規エージェント追加、プロンプト管理システム追加
- **データモデル**: プロンプト設定用の新規モデル追加
- **その他**: APIクライアント、キャッシュシステム

### 4.2 データモデル変更計画

**新規追加**:
- **PromptConfig**: APIエンドポイント、認証情報の管理
- **AgentType**: エージェント種別の定義
- **SessionState**: セッション切り替え時の状態管理

**既存システムへの影響**:
- **Agent基底クラス**: プロンプト取得方法の拡張
- **AgentController**: セッション切り替え機能の追加
- **PromptManager**: API取得機能の統合

### 4.3 変更が必要なファイル

**新規作成**:
- `openhands/agenthub/shared/prompt_client.py`: APIクライアント
- `openhands/agenthub/shared/models/prompt_config.py`: 設定モデル
- `openhands/agenthub/delegation_manager_agent/construction_delegation_agent.py`: 構築フェーズ管理
- `openhands/agenthub/delegation_manager_agent/extension_delegation_agent.py`: 機能拡張フェーズ管理
- `openhands/agenthub/session_switch_agent/session_switch_agent.py`: セッション切り替え
- `openhands/agenthub/specialist_agents/specialist_agent.py`: 専門エージェント

**既存ファイル修正**:
- `openhands/utils/prompt.py`: API取得機能の統合
- `openhands/controller/agent_controller.py`: セッション切り替え機能追加
- `openhands/agenthub/__init__.py`: 新規エージェントの登録

## 5. タスクリスト

### Phase 1: APIプロンプト取得システム実装
- [ ] **T1**: 共通APIクライアント実装（prompt_client.py）
- [ ] **T2**: プロンプト設定モデル実装（prompt_config.py）
- [ ] **T3**: PromptManagerへのAPI取得機能統合
- [ ] **T4**: キャッシュ機能実装（@lru_cache()活用）
- [ ] **T5**: デフォルトプロンプトフォールバック機能実装

### Phase 2: セッション切り替えエージェント実装
- [ ] **T6**: SpecialistAgent基底クラス実装
- [ ] **T7**: 16種類の専門エージェント実装
- [ ] **T8**: ConstructionDelegationAgent実装
- [ ] **T9**: ExtensionDelegationAgent実装
- [ ] **T10**: SessionSwitchAgent実装

### Phase 3: AgentController拡張
- [ ] **T11**: セッション切り替え機能追加
- [ ] **T12**: セッション状態管理機能実装
- [ ] **T13**: 権限委譲チェーン管理機能強化

### Phase 4: 統合・テスト
- [ ] **T14**: エージェント登録システム更新
- [ ] **T15**: 統合テスト実装
- [ ] **T16**: エラーハンドリング強化
- [ ] **T17**: ドキュメント更新

## 6. テスト計画

**APIプロンプト取得テスト**:
- API接続成功/失敗のテストケース
- キャッシュ機能のテストケース
- フォールバック機能のテストケース

**セッション切り替えテスト**:
- エージェント切り替えの正常動作テスト
- セッション状態保持のテストケース
- 権限委譲チェーンのテストケース

**統合テスト**:
- 構築フェーズの完全フローテスト
- 機能拡張フェーズのテストケース
- エラー発生時の復旧テスト

## 7. SCOPE_PROGRESSへの統合

```markdown
- [ ] **EXT-001**: APIプロンプト取得システム & セッション切り替えエージェントの実装
  - 目標: 2025-01-15
  - 参照: [/docs/api-prompt-system-implementation-plan.md]
  - 内容: 18種類のプロンプトAPI取得機能と16専門エージェントによる協調システムの実装
```

## 8. 備考

**実装優先順位**:
1. APIプロンプト取得システム（Phase 1）
2. 基本的なエージェント切り替え機能（Phase 2の一部）
3. 完全な協調システム（Phase 2-4）

**技術的考慮事項**:
- 既存のマイクロエージェント機能との共存
- 既存の権限委譲システムとの統合
- パフォーマンスへの影響最小化

**拡張性**:
- 新しい専門エージェントの追加が容易
- プロンプトの動的更新が可能
- 他のAPIサービスへの対応も可能