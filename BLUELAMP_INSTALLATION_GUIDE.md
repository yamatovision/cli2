# 🚀 BlueLamp AI 導入ガイド

あなたのシステムにBlueLamp AIを導入するための完全ガイドです。インストーラーを使わずに、ターミナル操作で簡単にセットアップできます。

## 📋 事前確認

まず、あなたの環境を確認してください：

### システム要件
- **Python 3.12以上** が必要です
- **インターネット接続** が必要です
- **VIPプラン/管理者/編集者権限** が必要です（有料プラン・お試しプランでは利用できません）

### 環境確認コマンド

**Windows (PowerShell/コマンドプロンプト):**
```cmd
python --version
```

**Mac/Linux (ターミナル):**
```bash
python3 --version
```

もしPythonがインストールされていない場合：
- **Windows**: Microsoft Store から「Python」を検索してインストール
- **Mac**: `brew install python` または https://www.python.org からダウンロード
- **Linux**: `sudo apt install python3 python3-pip` (Ubuntu/Debian) / `sudo yum install python3 python3-pip` (CentOS/RHEL)

---

## 🔧 インストール方法

### Windows

1. **PowerShellを管理者権限で開く**
   - Windowsキー + X → 「Windows PowerShell (管理者)」

2. **BlueLamp AIをインストール**
   ```powershell
   pip install bluelamp-ai
   ```

3. **インストール確認**
   ```powershell
   ブルーランプ --help
   ```

4. **初回セットアップ**
   ```powershell
   ブルーランプ
   ```

### Mac

1. **ターミナルを開く**
   - Command + Space → 「ターミナル」と入力

2. **BlueLamp AIをインストール**
   ```bash
   pip3 install bluelamp-ai
   ```

3. **インストール確認**
   ```bash
   ブルーランプ --help
   ```

4. **初回セットアップ**
   ```bash
   ブルーランプ
   ```

### Linux

1. **ターミナルを開く**
   - Ctrl + Alt + T

2. **BlueLamp AIをインストール**
   ```bash
   pip3 install bluelamp-ai
   ```

3. **インストール確認**
   ```bash
   ブルーランプ --help
   ```

4. **初回セットアップ**
   ```bash
   ブルーランプ
   ```

---

## 🎯 初回セットアップの流れ

`ブルーランプ` コマンドを実行すると、以下の手順で自動セットアップされます：

### 1. Portal認証
- メールアドレスとパスワードの入力を求められます
- VIP/管理者/編集者権限を持つアカウントでログイン

### 2. Claude APIキー設定
- Portal側でClaude APIキーが既に設定済みの場合は自動取得
- 未設定の場合は手動入力を求められます

### 3. 設定保存
- 認証情報が安全に保存されます
- 次回以降は自動ログイン

---

## 💡 使用方法

### オーケストレーターエージェント（プロジェクト設計・統括）
```bash
ブルーランプ
```

### 拡張マネージャーエージェント（機能実装・拡張）
```bash
ブルーランプ拡張
```

---

## 🔧 高度な設定（オプション）

### ドキュメント処理機能を追加
```bash
pip install bluelamp-ai[runtime]
```

### クラウド統合機能を追加
```bash
pip install bluelamp-ai[integrations]
```

---

## ❗ トラブルシューティング

### 「コマンドが見つかりません」エラー

**Windows:**
```powershell
# PATHの確認
echo $env:PATH

# Pythonスクリプトフォルダを追加
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Users\[ユーザー名]\AppData\Local\Programs\Python\Python312\Scripts", "User")
```

**Mac/Linux:**
```bash
# PATHの確認
echo $PATH

# ~/.bashrc または ~/.zshrc に追加
echo 'export PATH="$PATH:~/.local/bin"' >> ~/.bashrc
source ~/.bashrc
```

### 「Permission denied」エラー

**Windows:**
```powershell
pip install --user bluelamp-ai
```

**Mac/Linux:**
```bash
pip3 install --user bluelamp-ai
```

### Python バージョンが古い場合

**pyenv を使用してPython 3.12をインストール:**
```bash
# pyenv インストール (Mac)
brew install pyenv

# pyenv インストール (Linux)
curl https://pyenv.run | bash

# Python 3.12 インストール
pyenv install 3.12.0
pyenv global 3.12.0
```

---

## 📞 サポート

### 導入に関する質問
- Portal内のサポート機能をご利用ください
- VIP/管理者/編集者権限が正しく設定されているか確認

### システム要件の詳細
- **最小要件**: Python 3.12, 2GB RAM, 1GB ストレージ
- **推奨要件**: Python 3.12, 4GB RAM, 2GB ストレージ
- **対応OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+

---

## ✅ インストール成功の確認

以下のコマンドが正常に動作すれば、導入完了です：

```bash
# ヘルプ表示
ブルーランプ --help

# バージョン確認  
ブルーランプ --version

# セットアップテスト
ブルーランプ
```

🎉 これでBlueLamp AIの導入が完了しました！日本語で快適なAI開発体験をお楽しみください。