# BlueLamp CLI - OpenHands風UI実装提案

## 概要
OpenHandsのような視覚的にわかりやすいリアルタイムUIをBlueLamp CLIに実装する提案書です。

## 主要機能

### 1. リアルタイム実行表示
```typescript
// ui-manager.ts
class UIManager {
  // ボックス描画
  drawBox(title: string, content: string, style: 'command' | 'output' | 'edit') {
    const width = process.stdout.columns - 2;
    console.log('┌' + '─'.repeat(width - 2) + '┐');
    console.log(`│ ${title.padEnd(width - 4)} │`);
    console.log('├' + '─'.repeat(width - 2) + '┤');
    // コンテンツ表示
  }

  // プログレス表示
  showProgress(message: string, showPause: boolean = true) {
    const pauseHint = showPause ? ' (Press Ctrl-P to pause)' : '';
    console.log(`\n${chalk.blue('Agent running...')}${pauseHint}\n`);
  }
}
```

### 2. ファイル編集の差分表示
```typescript
// diff-visualizer.ts
class DiffVisualizer {
  showEdit(filePath: string, edits: Edit[]) {
    this.ui.drawBox('File Edit', '', 'edit');
    console.log(`│[Editing file ${filePath} with ${edits.length} changes.]│`);

    edits.forEach((edit, index) => {
      console.log(`│[begin of edit ${index + 1} / ${edits.length}]│`);
      console.log('│(content before edit)│');
      this.showDiff(edit.oldContent, edit.newContent);
      console.log(`│[end of edit ${index + 1} / ${edits.length}]│`);
    });
  }

  private showDiff(oldContent: string, newContent: string) {
    // 削除行を赤で、追加行を緑で表示
    oldContent.split('\n').forEach(line => {
      console.log(chalk.red(`│-${line}│`));
    });
    newContent.split('\n').forEach(line => {
      console.log(chalk.green(`│+${line}│`));
    });
  }
}
```

### 3. コマンド実行の可視化
```typescript
// command-executor.ts
class CommandExecutor {
  async execute(command: string): Promise<string> {
    // コマンド表示
    this.ui.drawBox('Command', command, 'command');

    // 実行
    const startTime = Date.now();
    const result = await this.runCommand(command);

    // 結果表示
    this.ui.drawBox('Command Output', result, 'output');

    // 長時間実行の警告
    const duration = Date.now() - startTime;
    if (duration > 60000) {
      this.showWarning(`Command took ${(duration/1000).toFixed(1)}s`);
    }

    return result;
  }
}
```

### 4. エージェントの動作状態表示
```typescript
// agent-status.ts
class AgentStatus {
  private status: 'idle' | 'running' | 'paused' | 'error' = 'idle';
  private currentTask: string = '';

  updateStatus(status: AgentStatus['status'], task?: string) {
    this.status = status;
    if (task) this.currentTask = task;
    this.render();
  }

  private render() {
    process.stdout.write('\r'); // カーソルを行頭に
    const statusIcon = {
      idle: '⭘',
      running: '⚡',
      paused: '⏸',
      error: '⚠️'
    }[this.status];

    const message = `${statusIcon} ${this.currentTask}`;
    process.stdout.write(message);
  }
}
```

### 5. インタラクティブ機能
```typescript
// interactive-handler.ts
class InteractiveHandler {
  constructor() {
    // Ctrl+P でポーズ
    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'p') {
        this.pauseAgent();
      }
    });
  }

  private pauseAgent() {
    console.log('\n' + chalk.yellow('⏸ Agent paused. Type /resume to continue.'));
    this.agent.pause();
  }
}
```

## 実装計画

### Phase 1: 基本UI（1週間）
- ボックス描画システム
- カラー出力（chalk使用）
- 基本的なプログレス表示

### Phase 2: 差分表示（1週間）
- ファイル編集の可視化
- 追加/削除行の色分け
- 複数編集のバッチ表示

### Phase 3: インタラクティブ機能（1週間）
- Ctrl+Pによるポーズ機能
- /resumeコマンド
- リアルタイムステータス更新

### Phase 4: 高度な機能（1週間）
- 長時間実行の警告
- エラーの視覚的表示
- 並列実行の可視化

## 技術要件

### 必要なパッケージ
```json
{
  "dependencies": {
    "chalk": "^5.4.1",      // カラー出力
    "ora": "^8.0.1",        // スピナー
    "boxen": "^7.1.1",      // ボックス描画
    "cli-progress": "^3.12.0", // プログレスバー
    "keypress": "^0.2.1"    // キー入力検知
  }
}
```

### ターミナル要件
- 256色対応
- UTF-8サポート（ボックス描画文字）
- 最小幅80文字推奨

## 期待される効果

1. **視認性の向上**
   - 何が実行されているか一目でわかる
   - エラーや警告が見逃されない

2. **操作性の改善**
   - 長時間実行をポーズできる
   - インタラクティブな操作が可能

3. **デバッグの容易さ**
   - 実行履歴が視覚的に確認できる
   - 問題箇所が特定しやすい

4. **ユーザー体験の向上**
   - プロフェッショナルな見た目
   - 進捗が把握しやすい

## サンプル実行画面

```
┌─────────────────────────────────────| Command |─────────────────────────────────────┐
│$ npm install                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

⚡ Installing dependencies...

┌─────────────────────────────────| Command Output |──────────────────────────────────┐
│added 267 packages, and audited 268 packages in 15s                                 │
│                                                                                     │
│found 0 vulnerabilities                                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

Agent running... (Press Ctrl-P to pause)

┌────────────────────────────────────| File Edit |────────────────────────────────────┐
│[Editing file package.json with 1 changes.]                                         │
│[begin of edit 1 / 1]                                                               │
│(content before edit)                                                                │
│-5|  "version": "1.0.0",                                                            │
│(content after edit)                                                                 │
│+5|  "version": "1.1.0",                                                            │
│[end of edit 1 / 1]                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## まとめ

OpenHandsのUIをBlueLamp CLIに実装することで、以下が実現できます：

1. **視覚的にわかりやすい実行状況**
2. **インタラクティブな操作**
3. **プロフェッショナルな見た目**
4. **デバッグの容易さ**

これにより、BlueLamp CLIがより使いやすく、強力なツールに進化します。
