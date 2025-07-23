# BlueLamp CLI バイナリビルドガイド

## 概要

このガイドでは、BlueLamp CLIをスタンドアロンバイナリとしてビルドする方法を説明します。
既存のPythonベースの実装に影響を与えることなく、配布可能な単一実行ファイルを作成できます。

## ビルド手順

### 1. 前提条件

- Python 3.12以上がインストールされていること
- Poetry環境がセットアップされていること

### 2. ビルドの実行

```bash
# ビルドスクリプトを実行
python build_binary.py
```

このスクリプトは以下を自動的に実行します：
- 古いビルドディレクトリのクリーンアップ
- PyInstallerのインストール（必要な場合）
- バイナリのビルド

### 3. 生成されるファイル

ビルドが完了すると、`dist/`ディレクトリに以下のファイルが生成されます：
- `bluelamp` (Linux/macOS) または `bluelamp.exe` (Windows)

## ファイル構成

### 新規作成されるファイル

1. **build_binary.py**
   - バイナリビルドを自動化するPythonスクリプト
   - クリーンアップ、依存関係のインストール、ビルドを実行

2. **bluelamp.spec**
   - PyInstallerの設定ファイル
   - 含めるモジュール、データファイル、除外するパッケージを定義

3. **bluelamp_binary_entry.py**
   - バイナリ専用のエントリーポイント
   - PyInstallerでの実行時の特殊な初期化処理を含む

### 既存ファイルへの影響

**既存のファイルは一切変更されません。** すべての変更は新規ファイルに限定されています。

## カスタマイズ

### アイコンの追加

Windows用の.icoファイルやmacOS用の.icnsファイルを追加する場合：

```python
# bluelamp.spec内で
icon='path/to/your/icon.ico',  # または .icns
```

### 追加モジュールの含有

特定のモジュールが見つからない場合は、`bluelamp.spec`の`hiddenimports`リストに追加：

```python
hiddenimports = [
    # ... 既存のインポート
    'your.additional.module',
]
```

## トラブルシューティング

### ビルドエラーが発生する場合

1. PyInstallerを最新版に更新：
   ```bash
   pip install --upgrade pyinstaller
   ```

2. ビルドディレクトリをクリーン：
   ```bash
   rm -rf build dist __pycache__
   ```

### 実行時エラーが発生する場合

モジュールが見つからないエラーは、通常`hiddenimports`への追加で解決できます。

## 配布

生成されたバイナリは単一ファイルとして配布可能です。
ユーザーはPython環境なしで実行できます。

```bash
# 実行例
./bluelamp
```

## 注意事項

- バイナリサイズは通常100MB以上になります（すべての依存関係を含むため）
- 初回起動時は展開処理のため少し時間がかかる場合があります
- プラットフォーム固有のバイナリが生成されます（クロスコンパイルは不可）