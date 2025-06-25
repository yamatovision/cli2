# Claude Code プロンプト統合計画

## 結論

要件定義エージェントのプロンプトを「一文字も変えずに」使用したい場合、**BlueLamp CLI Originalを拡張する方が適切**です。

## 理由

### 1. プロンプトの完全互換性
- BlueLamp CLIは既にMarkdown形式のプロンプトファイルをサポート
- Claude Codeのプロンプトをそのままコピーして使用可能
- メタデータ（依存関係、ツール）は別ファイル（agents.json）で管理

### 2. 既存インフラの活用
BlueLamp CLIには以下が既に実装済み：
- 16エージェントのオーケストレーションシステム
- Claude API統合
- ファイル操作・コマンド実行ツール
- エージェント間の依存関係管理

### 3. 最小限の変更で実装可能

## 実装手順

### Step 1: Claude Codeプロンプトの配置
```bash
# 既存の16agentsディレクトリに配置
cp /path/to/claude-code/01_requirements_engineer.md \
   /bluelamp-cli/16agents/01_requirements_engineer.md
```

### Step 2: agents.json の更新
```json
{
  "★1": {
    "id": "01_requirements_engineer",
    "name": "要件定義エンジニア",
    "role": "顧客のアイデアを詳細な要件定義書に落とし込む",
    "category": "design",
    "promptFile": "01_requirements_engineer.md",  // Claude Codeのファイルを指定
    "dependencies": [],
    "outputs": ["docs/requirements.md"],
    "tools": ["file_operations", "message"]
  }
}
```

### Step 3: 応答フォーマットの調整（必要最小限）

Claude Codeのプロンプトの最後に以下を追加するだけ：

```markdown
## 応答フォーマット

以下の形式で応答してください：

### 分析結果
[現在の状況分析]

### 実行計画
[これから実行する作業の計画]

### ファイル操作
```json
{
  "operations": [
    {
      "type": "create",
      "path": "docs/requirements.md",
      "content": "ファイル内容..."
    }
  ]
}
```

### コマンド実行
```json
{
  "commands": []
}
```

### 次のステップ
[次に必要な作業]
```

### Step 4: 実行テスト
```bash
# BlueLamp CLIで要件定義エージェントを実行
npm run agent -- --agent="★1" --prompt="ECサイトを作りたい"
```

## OpenHandsとの連携（将来的な統合）

### Phase 1: BlueLamp CLIでの完全動作確認
- Claude Codeのプロンプトがそのまま動作することを確認
- 16エージェント全体のフローをテスト

### Phase 2: OpenHandsへの知見の移植
- BlueLamp CLIで確立したパターンをPythonで再実装
- OpenHandsのMicroAgent機能として統合

### Phase 3: 相互運用性の確立
- BlueLamp CLIをOpenHandsのフロントエンドとして使用
- OpenHandsのランタイムをBlueLamp CLIから呼び出し

## 比較表

| 項目 | OpenHands直接実装 | BlueLamp CLI拡張 |
|------|------------------|-----------------|
| プロンプト変更 | 必須（.md → .j2） | 最小限（フォーマット追記のみ） |
| 実装工数 | 高（Python移植） | 低（既存システム活用） |
| Claude Code互換性 | 部分的 | 完全 |
| 既存機能活用 | 新規実装必要 | そのまま使用可能 |
| 将来的な統合 | - | OpenHandsと連携可能 |

## 推奨事項

1. **短期的目標**: BlueLamp CLIでClaude Codeプロンプトを完全動作させる
2. **中期的目標**: 16エージェント全体をBlueLamp CLIで実装・検証
3. **長期的目標**: OpenHandsとの統合・相互運用性確立

この方法により、要件定義エージェントのプロンプトを「一文字も変えずに」使用しながら、段階的にシステムを構築できます。
