# 機能拡張計画: openhands2委譲システム修正 2025-01-05

## 1. 拡張概要

openhands2コマンドのDelegationAgentが正しく動作せず、16専門エージェントへの委譲が機能していない問題を解決する。cli/の完全動作システムをcli2/に統合し、APIからのプロンプト取得と実際のエージェント切り替えを実現する。

## 2. 詳細仕様

### 2.1 現状と課題

**現在の実装状況:**
- cli2/のDelegationAgentは起動するが、実際の委譲が動作しない
- "No agent class registered under 'DelegationAgent'"エラー
- プロンプトがAPIから取得されず、ローカルファイルにフォールバック
- 16専門エージェントが登録されていない

**課題:**
- cli/には完全動作する委譲システムが存在するが、cli2/に移植されていない
- bluelamp_delegate.pyツールが不足
- bluelamp_agentsディレクトリが不足
- エージェント登録システムの不整合

### 2.2 拡張内容

**1. 16専門エージェントシステムの統合**
- cli/openhands/agenthub/bluelamp_agents/をcli2/に完全移植
- 各エージェントのPortalPromptManager統合
- エージェント登録システムの修正

**2. 委譲ツールシステムの統合**
- cli/openhands/agenthub/codeact_agent/tools/bluelamp_delegate.pyをcli2/に移植
- 16個の委譲ツール関数の統合
- DelegationAgentでの委譲ツール有効化

**3. プロンプトAPI取得システムの修正**
- StarPromptManagerの非同期処理問題解決
- "This event loop is already running"エラーの修正
- APIからのオーケストレーター用プロンプト取得

**4. エージェント登録システムの修正**
- DelegationAgentクラスの正しい登録
- agenthub/__init__.pyの更新
- エージェント切り替え機能の実装

## 3. ディレクトリ構造

```
cli2/openhands/agenthub/
├── bluelamp_agents/                    # 新規追加
│   ├── __init__.py                     # エージェント登録
│   ├── agents.py                       # 16専門エージェント定義
│   └── prompts/                        # フォールバック用プロンプト
├── codeact_agent/
│   └── tools/
│       └── bluelamp_delegate.py        # 新規追加：委譲ツール
├── delegation_agent/
│   ├── delegation_agent.py             # 修正：登録問題解決
│   └── prompts/                        # 既存
└── __init__.py                         # 修正：DelegationAgent登録
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: なし
- **バックエンド**: openhands2コマンドの動作改善
- **データモデル**: なし
- **その他**: エージェント登録システム、プロンプト取得システム

### 4.2 データモデル変更計画

- **型定義変更**: なし
- **データベーススキーマ**: なし
- **API レスポンス形式**: なし
- **バリデーション**: なし
- **マイグレーション**: なし

### 4.3 変更が必要なファイル

```
- cli2/openhands/agenthub/__init__.py: DelegationAgent登録追加
- cli2/openhands/agenthub/bluelamp_agents/__init__.py: 新規作成（16エージェント登録）
- cli2/openhands/agenthub/bluelamp_agents/agents.py: 新規作成（エージェント定義）
- cli2/openhands/agenthub/codeact_agent/tools/bluelamp_delegate.py: 新規作成（委譲ツール）
- cli2/openhands/agenthub/delegation_agent/delegation_agent.py: 修正（登録問題解決）
- cli2/openhands/agenthub/shared/star_prompt_manager.py: 修正（非同期処理問題解決）
```

## 5. タスクリスト

```
- [ ] **T1**: bluelamp_agentsディレクトリの完全移植
- [ ] **T2**: bluelamp_delegate.pyツールの移植と統合
- [ ] **T3**: DelegationAgentの登録問題修正
- [ ] **T4**: StarPromptManagerの非同期処理問題修正
- [ ] **T5**: エージェント切り替え機能の動作確認
- [ ] **T6**: openhands2コマンドの完全動作テスト
```

### 6. テスト計画

**テストケース:**
1. openhands2起動テスト
2. DelegationAgent正常登録確認
3. 16専門エージェントへの切り替えテスト
4. プロンプトAPI取得テスト
5. 委譲ツール動作確認
6. エンドツーエンド動作確認

**検証ポイント:**
- "No agent class registered"エラーの解消
- プロンプトがAPIから正常取得される
- エージェント切り替えが実際に動作する
- 委譲ツールが利用可能になる

## 7. SCOPE_PROGRESSへの統合

```markdown
- [ ] **T-DELEGATION**: openhands2委譲システム修正
  - 目標: 2025-01-05
  - 参照: [/docs/openhands2-delegation-system-fix.md]
  - 内容: DelegationAgent登録問題解決、16専門エージェント統合、委譲ツール実装
```

## 8. 備考

**重要な注意点:**
- cli/の動作システムを基準として、cli2/に完全移植する
- 既存のcli2/システムを破壊しないよう段階的に実装
- 非同期処理の問題は慎重に対処する
- テスト環境での十分な検証を行う

**代替案:**
- 段階的実装：まず1つのエージェントで動作確認後、全16エージェントを統合
- フォールバック機能：API取得失敗時のローカルプロンプト使用