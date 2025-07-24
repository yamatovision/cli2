# BlueLamp CLI 自動ビルド・リリース手順

## 準備

1. **現在の状態を確認**
```bash
git status
```

2. **必要なファイルをステージング**
```bash
git add .github/workflows/build-binaries.yml
git add bluelamp-windows.spec
git add bluelamp-linux.spec
git add Dockerfile.linux-build
git add build-linux.sh
```

3. **コミット**
```bash
git commit -m "Add cross-platform binary build configuration"
```

4. **GitHubにプッシュ**
```bash
git push origin cleanup/dependency-removal-20250723
```

## GitHub Actionsの実行

### オプション1: 手動実行（テスト用）
1. GitHubのリポジトリページを開く
2. "Actions" タブをクリック
3. "Build Cross-Platform Binaries" ワークフローを選択
4. "Run workflow" ボタンをクリック
5. ブランチを選択して "Run workflow" を実行

### オプション2: タグによる自動実行（リリース用）
```bash
# バージョンタグを作成（例: v1.4.2）
git tag v1.4.2

# タグをGitHubにプッシュ
git push origin v1.4.2
```

## リリースの確認

1. GitHubの "Actions" タブでビルドの進行状況を確認
2. ビルドが成功したら、"Releases" ページに移動
3. 自動作成されたリリースに以下のファイルが含まれていることを確認：
   - `bluelamp` (Linux用)
   - `bluelamp.exe` (Windows用)
   - `bluelamp` (macOS用)

## トラブルシューティング

### ビルドが失敗する場合
1. Actions タブでエラーログを確認
2. 各OSごとのspec ファイルのパスを確認
3. Poetry の依存関係が正しくインストールされているか確認

### 権限エラーの場合
- GitHubリポジトリの Settings > Actions > General で権限を確認
- "Workflow permissions" を "Read and write permissions" に設定

## ローカルでのテスト

Linux用バイナリをローカルでテストする場合：
```bash
./build-linux.sh
```

## 注意事項

- 初回実行時は各OSでの依存関係のインストールに時間がかかります
- Windows用バイナリはWindows Defenderで警告が出る場合があります
- macOS用バイナリは初回実行時にセキュリティ警告が出る場合があります