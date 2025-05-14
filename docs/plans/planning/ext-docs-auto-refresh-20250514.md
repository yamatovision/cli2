# 機能拡張計画: ファイルビューワー自動更新機能 2025-05-14
あああああ
## 1. 拡張概要

ファイルビューワーに自動更新機能を追加し、`/docs` ディレクトリとそのサブディレクトリに対してファイル監視機能を実装します。ファイルの作成・変更・削除を検知した際に、現在表示中のファイルリストとファイル内容を自動的に更新します。これにより、ユーザーは手動でリフレッシュしなくても常に最新のドキュメント状態を確認できるようになります。

## 2. 詳細仕様

### 2.1 現状と課題

現在のファイルビューワーでは、ファイルリストの更新とファイル内容の読み込みは定期的なポーリングやユーザーの明示的な操作でのみ行われており、ファイルシステムの変更を自動的に検知して反映する機能がありません。そのため、外部ツールでドキュメントを編集した場合、ユーザーは手動で更新操作を行う必要があります。

プロジェクト内では既に`SCOPE_PROGRESS.md`などの特定ファイルに対する監視機能が`FileSystemService`と`FileWatcherService`に実装されているため、これらを基にファイルビューワー向けの拡張が必要です。

### 2.2 拡張内容

1. `/docs` ディレクトリ全体（サブディレクトリを含む）に対するファイル監視機能を実装
2. ファイルビューワーが開いている間のみ監視を行う（リソース最適化のため）
3. ファイル変更（作成・更新・削除）を検知した場合、以下の処理を自動実行:
   - 現在表示中のディレクトリリストを更新
   - 現在表示中のファイル内容が変更された場合はその内容も更新
4. SCOPE_PROGRESS.mdの監視に使われている実装を参考に、効率的な監視機能を実現

### 3 ディレクトリ構造

この機能拡張では、既存ファイルの修正が主となるため、新規ファイルの追加は最小限です。監視機能自体は既存の`FileSystemServiceImpl`と`FileWatcherServiceImpl`に実装され、ファイルビューワーパネルとの連携機能を追加します。

```
src/
 ├── ui/
 │   ├── fileViewer/
 │   │   └── FileViewerPanel.ts     # 変更: docsディレクトリ監視機能を追加
 │   └── scopeManager/
 │       └── services/
 │           └── implementations/
 │               ├── FileSystemServiceImpl.ts  # 変更: ディレクトリ監視機能を拡張
 │               └── FileWatcherServiceImpl.ts # 変更: ディレクトリ監視の連携機能を追加
 └── services/
     └── AppGeniusEventBus.ts      # 変更: ファイル変更イベントタイプを追加
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: FileViewerPanelコンポーネント（監視設定と更新処理の追加）
- **バックエンド**: なし（VSCodeの拡張機能内のサービスのみ変更）
- **データモデル**: なし（型定義の変更は不要）
- **その他**: VSCodeのFileSystemWatcherリソース使用量（監視対象が増加するため）

### 4.2 変更が必要なファイル

```
- src/ui/fileViewer/FileViewerPanel.ts: docsディレクトリ監視機能の追加・変更検知時の更新処理の実装
- src/ui/scopeManager/services/implementations/FileSystemServiceImpl.ts: ディレクトリワイド監視機能の拡張または新規追加
- src/ui/scopeManager/services/implementations/FileWatcherServiceImpl.ts: ディレクトリ監視イベントの連携処理の最適化
- src/services/AppGeniusEventBus.ts: ファイル変更イベントタイプの追加
```

## 5. タスクリスト

```
- [x] **T1**: FileSystemServiceImplに`setupDocsDirectoryWatcher`メソッドを追加
  - docs全体とサブディレクトリを監視する機能を実装
  - ファイル変更イベントの取得と配信機能を追加
  - 連続変更検知時のデバウンス処理の実装

- [x] **T2**: FileWatcherServiceImplに`setupDocsDirectoryWatcher`メソッドを実装
  - ファイルビューワー用の監視設定と設定解除機能を実装
  - 変更イベントを適切にハンドリングする仕組みを追加
  - AppGeniusEventBusを使った変更通知機能の実装

- [x] **T3**: FileViewerPanelに監視機能と自動更新処理を実装
  - `_setupDocsFileWatcher`メソッドを追加
  - ファイルビューワーの初期化時に監視を開始する処理を実装
  - 監視終了時の適切なリソース解放処理を実装
  - 変更イベント受信時のファイルリスト更新処理を実装
  - 表示中ファイルの変更検知時の内容更新処理を実装

- [x] **T4**: 変更検知時の適切なデバウンス処理の実装
  - 多数のファイル変更が連続して発生した場合の処理最適化
  - 500msのデバウンスタイマーを実装
  - 変更ファイルの重複登録防止（Setによる管理）

- [ ] **T5**: テストとデバッグ
  - 機能動作確認
  - リソース使用量の検証
  - エッジケース（大量ファイル変更など）の動作確認
```

## 6. 実装詳細

### 6.1 FileSystemServiceImpl.ts の変更点

`setupDocsDirectoryWatcher` メソッドを追加し、以下の機能を実装しました：

1. VSCodeの`FileSystemWatcher`を使用してdocsディレクトリ全体を監視
2. ファイル変更・作成・削除イベントを捕捉し、共通ハンドラに送信
3. 複数のファイル変更を一括処理するためのデバウンス機能
   - 500msの待機時間を設け、その間に発生した変更をまとめて処理
   - 重複ファイルパスの排除のため`Set`で管理
4. リソース解放のための適切なDispose処理

```typescript
public setupDocsDirectoryWatcher(
  projectPath: string,
  outputCallback: (filePath: string) => void,
  options?: { delayedReadTime?: number }
): vscode.Disposable {
  // ... 実装省略 ...
}
```

### 6.2 FileWatcherServiceImpl.ts の変更点

`setupDocsDirectoryWatcher` メソッドを実装し、以下の機能を追加しました：

1. FileSystemServiceImplの監視機能をラップ
2. ファイル変更イベントをコールバックに通知
3. AppGeniusEventBusを使用してシステム全体に変更を通知
4. DOCS_FILE_CHANGEDイベントタイプによる明示的な通知
5. エラーハンドリングとロギング機能

```typescript
public setupDocsDirectoryWatcher(
  projectPath: string,
  fileSystemService: any,
  onFileChanged: (filePath: string) => void,
  options?: { delayedReadTime?: number }
): vscode.Disposable {
  // ... 実装省略 ...
}
```

### 6.3 FileViewerPanel.ts の変更点

1. `_setupDocsFileWatcher` メソッドを追加
   - パネルが表示されている間だけdocsディレクトリの監視を行う
   - 既存の監視システムと干渉しないよう設計

2. `_getCurrentDisplayedDirectory` ヘルパーメソッドを追加
   - 現在表示中のディレクトリを特定
   - 分割表示モードでの左右ペイン対応

3. `_isPanelAlive` ヘルパーメソッドを追加
   - パネルが既に閉じられていないかを確認
   - 無効なメッセージ送信によるエラー防止

4. 監視リソースの解放処理を追加
   - パネル破棄時に全ての監視リソースを適切に解放

### 6.4 AppGeniusEventBus.ts の変更点

```typescript
export enum AppGeniusEventType {
  // ... 既存のイベントタイプ ...
  DOCS_FILE_CHANGED = 'docs-file-changed' // 追加: docsディレクトリ内のファイル変更イベント
}
```

## 7. テスト計画

1. **機能テスト**
   - `/docs` ディレクトリ内でファイルを新規作成し、ファイルリストに自動反映されることを確認
   - 既存ファイルを外部エディタで更新し、ファイルビューワーに変更が反映されることを確認
   - ファイルを削除し、リストから自動的に削除されることを確認
   - サブディレクトリ内のファイル変更も検知されることを確認

2. **パフォーマンステスト**
   - 大量のファイル（20-30個）を同時に変更した場合の動作を確認
   - リソース使用状況の監視（メモリ使用量、CPU使用率）
   - ビューワーの応答性が維持されることの確認

3. **エッジケーステスト**
   - ファイルビューワーが閉じているときに変更が発生した場合の挙動
   - 再度開いたときにファイルリストが最新状態で表示されることの確認
   - ファイルビューワー操作中にファイル変更が発生した場合の挙動を検証

## 8. SCOPE_PROGRESSへの統合

[SCOPE_PROGRESS.md](/docs/SCOPE_PROGRESS.md)に以下の単体タスクとして追加します：

```markdown
- [ ] **UI-1**: ファイルビューワー自動更新機能の実装
  - 目標: 2025-05-17
  - 参照: [/docs/plans/planning/ext-docs-auto-refresh-20250514.md](/docs/plans/planning/ext-docs-auto-refresh-20250514.md)
  - 内容: ファイルビューワーに/docsディレクトリの自動監視・更新機能を追加
```

## 9. 備考

- ファイルシステム監視はリソースを消費するため、監視対象はファイルビューワーが表示されている間のみとし、パネルが閉じられる際には適切にDispose処理を行う必要があります。
- VSCodeのFileSystemWatcherは変更イベントをリアルタイムで提供しますが、大量の変更が発生した場合にデバウンス処理が必要となるため、500msの遅延時間を設けることで安定性を確保します。
- 既に実装されている`SCOPE_PROGRESS.md`の監視機能を応用することで、効率的に機能を実現できます。
- フォーカスされたファイルが変更された場合は、自動的に内容を更新するユーザー体験を提供します。
