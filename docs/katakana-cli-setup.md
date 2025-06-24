# カタカナCLIコマンドのセットアップガイド

## BlueLamp CLIをカタカナで起動する方法

### 方法1: package.json でのbin登録（開発者向け）

```json
{
  "name": "bluelamp-cli",
  "bin": {
    "bluelamp": "./dist/index.js",
    "ブルーランプ": "./dist/index.js",
    "青灯": "./dist/index.js"
  }
}
```

インストール後、以下のコマンドが使用可能：
```bash
$ ブルーランプ
$ 青灯
```

### 方法2: シェルエイリアス（ユーザー向け）

#### Mac/Linux (.bashrc または .zshrc)
```bash
# BlueLamp CLI
alias ブルーランプ='bluelamp'
alias ぶるーらんぷ='bluelamp'
alias 青い灯='bluelamp'

# OpenHands
alias オープンハンズ='openhands'
alias おーぷんはんず='openhands'
```

#### Windows PowerShell
```powershell
# $PROFILE を編集
notepad $PROFILE

# 以下を追加
function ブルーランプ {
    param([Parameter(ValueFromRemainingArguments=$true)]$args)
    & bluelamp @args
}

function オープンハンズ {
    param([Parameter(ValueFromRemainingArguments=$true)]$args)
    & openhands @args
}
```

### 方法3: バッチファイル作成（Windows）

`ブルーランプ.bat` を作成：
```batch
@echo off
bluelamp %*
```

PATHの通った場所に配置すれば、コマンドプロンプトから実行可能。

### 方法4: Node.jsスクリプト

`/usr/local/bin/ブルーランプ` を作成：
```javascript
#!/usr/bin/env node
require('bluelamp-cli');
```

実行権限を付与：
```bash
chmod +x /usr/local/bin/ブルーランプ
```

## 使用例

```bash
# 通常の起動
$ bluelamp

# カタカナでの起動
$ ブルーランプ

# パラメータも渡せる
$ ブルーランプ --help
$ ブルーランプ init
```

## 注意事項

1. **文字エンコーディング**
   - UTF-8環境で使用すること
   - Windowsではchcp 65001でUTF-8モードに

2. **ターミナルの設定**
   - 日本語フォントが必要
   - iTerm2、Windows Terminal推奨

3. **Git管理**
   - カタカナファイル名はGitで問題なく管理可能
   - チーム開発では英語名も併用推奨

## トラブルシューティング

### カタカナコマンドが認識されない場合

1. 文字コードを確認
```bash
$ locale
LANG=ja_JP.UTF-8  # これが表示されればOK
```

2. シェルの再起動
```bash
$ source ~/.bashrc
# または
$ exec $SHELL
```

3. パスの確認
```bash
$ which ブルーランプ
```

## 実装例：BlueLamp CLIでの対応

```typescript
// package.json
{
  "bin": {
    "bluelamp": "./dist/index.js",
    "ブルーランプ": "./dist/index.js",
    "bluelamp-cli": "./dist/index.js"
  }
}

// index.ts の最初に追加
#!/usr/bin/env node
// -*- coding: utf-8 -*-

console.log('🔵 ブルーランプCLIへようこそ！');
```

これで、お好みの方法でカタカナコマンドを設定できます！
