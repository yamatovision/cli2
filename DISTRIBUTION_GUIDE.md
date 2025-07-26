# BlueLamp CLI 配布ガイド

## 配布方法

### 1. GitHub Releases（推奨）
- **URL**: `https://github.com/yamatovision/cli2/releases`
- タグをプッシュすると自動的にリリースページが作成されます
- ユーザーは直接バイナリをダウンロードできます

### 2. 独自のウェブサイト
BlueLampの公式サイトを作成して、そこからダウンロードリンクを提供：

```html
<h2>BlueLamp CLI ダウンロード</h2>
<ul>
  <li><a href="https://github.com/yamatovision/cli2/releases/latest/download/bluelamp">Linux版</a></li>
  <li><a href="https://github.com/yamatovision/cli2/releases/latest/download/bluelamp.exe">Windows版</a></li>
  <li><a href="https://github.com/yamatovision/cli2/releases/latest/download/bluelamp-mac">macOS版</a></li>
</ul>
```

### 3. インストールスクリプト
ワンライナーでインストールできるスクリプトを提供：

```bash
# Linux/macOS用
curl -L https://github.com/yamatovision/cli2/releases/latest/download/bluelamp -o /usr/local/bin/bluelamp && chmod +x /usr/local/bin/bluelamp

# または
wget https://github.com/yamatovision/cli2/releases/latest/download/bluelamp -O /usr/local/bin/bluelamp && chmod +x /usr/local/bin/bluelamp
```

### 4. パッケージマネージャー（将来的に）
- **Homebrew** (macOS/Linux)
- **Chocolatey** (Windows)
- **Snap** (Linux)
- **AUR** (Arch Linux)

## インストール手順（ユーザー向け）

### Windows
1. `bluelamp.exe` をダウンロード
2. 任意のフォルダに配置（例：`C:\Program Files\BlueLamp\`）
3. システムのPATHに追加
4. コマンドプロンプトで `bluelamp` を実行

### macOS
1. `bluelamp` をダウンロード
2. ターミナルで実行権限を付与：
   ```bash
   chmod +x bluelamp
   ```
3. `/usr/local/bin/` に移動：
   ```bash
   sudo mv bluelamp /usr/local/bin/
   ```
4. 初回実行時にセキュリティ警告が出た場合：
   - システム環境設定 > セキュリティとプライバシー > 「このまま開く」

### Linux
1. `bluelamp` をダウンロード
2. 実行権限を付与：
   ```bash
   chmod +x bluelamp
   ```
3. `/usr/local/bin/` に移動：
   ```bash
   sudo mv bluelamp /usr/local/bin/
   ```

## セキュリティ考慮事項

### コード署名（推奨）
- **Windows**: Authenticodeで署名
- **macOS**: Apple Developer IDで署名
- **Linux**: GPG署名

### チェックサム
各バイナリのSHA256チェックサムを提供：

```bash
# チェックサムファイルの作成
sha256sum bluelamp* > checksums.txt
```

## 自動更新機能（将来的に）
バイナリに自動更新機能を組み込むことで、ユーザーは最新版を簡単に入手できます。

## サポートとドキュメント

### README.md
```markdown
# BlueLamp CLI

日本語対応AIエージェントシステム

## インストール

### バイナリ版（推奨）
[リリースページ](https://github.com/yamatovision/cli2/releases)から
お使いのOSに対応したバイナリをダウンロードしてください。

### 使い方
```bash
bluelamp
```

### トラブルシューティング
- Windows: Windows Defenderの警告が出る場合は「詳細情報」→「実行」
- macOS: 「開発元が未確認」エラーは、システム環境設定で許可
- Linux: 実行権限がない場合は `chmod +x bluelamp` を実行
```

## 配布チャンネル

1. **公式サイト**: 最も信頼性が高い
2. **GitHub Releases**: 開発者向け
3. **SNS/ブログ**: アナウンス用
4. **技術系フォーラム**: Qiita、Zenn等での紹介記事