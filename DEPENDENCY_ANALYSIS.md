# BlueLamp CLI 依存関係軽量化分析レポート

## 📊 概要統計
- **現在のバイナリサイズ**: 383MB
- **目標サイズ**: 50-100MB（約75%削減）
- **削除可能な依存関係**: 約500MB分

## 🎯 削除優先度別リスト

### 🔴 最高優先度（即座削除可能 - 約300MB削減）

| パッケージ | サイズ | 用途 | 削除理由 | 影響 |
|------------|--------|------|----------|------|
| **tree-sitter-language-pack** | 282MB | コード解析AST | CLI機能で未使用 | なし |
| **pandas** | 48MB | データ分析 | テストのみで使用 | テスト機能停止 |
| **speech_recognition** | 43MB | 音声認識 | CLI機能で未使用 | なし |
| **numpy** | 23MB | 数値計算 | 間接依存のみ | なし |
| **matplotlib** | 23MB | グラフ描画 | CLI機能で未使用 | なし |
| **fontTools** | 12MB | フォント処理 | matplotlib依存 | なし |
| **PIL (Pillow)** | 10MB | 画像処理 | CLI機能で未使用 | なし |
| **networkx** | 7.7MB | グラフ理論 | CLI機能で未使用 | なし |
| **libcst** | 8.0MB | Python AST | 開発用ツール | なし |

### 🟡 中優先度（条件付き削除可能 - 約150MB削減）

| パッケージ | サイズ | 用途 | 削除条件 | 影響 |
|------------|--------|------|----------|------|
| **googleapiclient** | 85MB | Google API | Sheets機能不要の場合 | Google Sheets連携停止 |
| **grpc** | 31MB | gRPC通信 | Google API不要の場合 | Google関連機能停止 |
| **lxml** | 18MB | XML/HTML解析 | Web解析不要の場合 | Web解析機能低下 |
| **google** | 13MB | Google統合 | Google API不要の場合 | Google関連機能停止 |
| **pdfminer** | 8.0MB | PDF解析 | PDF処理不要の場合 | PDF解析機能停止 |
| **youtube_transcript_api** | 8.8MB | YouTube字幕 | YouTube機能不要の場合 | YouTube字幕取得停止 |

### 🟢 必須パッケージ（保持必要 - 約100MB）

| パッケージ | サイズ | 用途 | 保持理由 |
|------------|--------|------|----------|
| **litellm** | 33MB | LLM統合 | コア機能 |
| **cryptography** | 22MB | 暗号化 | 認証・セキュリティ |
| **tokenizers** | 7.6MB | トークン化 | AI機能 |
| **aiohttp** | 5.2MB | HTTP通信 | API通信 |
| **prompt-toolkit** | 4.1MB | CLI UI | ユーザーインターフェース |
| **openai** | 2.5MB | OpenAI API | AI機能 |
| **fastapi** | 2.1MB | Web API | 必要に応じて |

## 🛠️ 実行プラン

### Phase 1: 即座削除（約300MB削減）
```bash
# pyproject.tomlから削除
# [tool.poetry.dependencies]から削除
- pandas (テストグループに移動)
- numpy (完全削除)
- matplotlib (完全削除)
- speech_recognition (完全削除)
- PIL/Pillow (完全削除)
- tree-sitter-languages (完全削除)
```

### Phase 2: 機能確認後削除（約150MB削減）
```bash
# 機能別に段階的削除
- Google Sheets機能の利用状況確認
- PDF処理機能の利用状況確認  
- YouTube機能の利用状況確認
```

### Phase 3: PyInstaller最適化（約50MB削減）
```bash
# ビルド時の最適化オプション
--exclude-module pandas
--exclude-module numpy  
--exclude-module matplotlib
--exclude-module PIL
--exclude-module speech_recognition
--exclude-module tree_sitter
```

## 📈 削減効果試算

| フェーズ | 削減サイズ | 残りサイズ | 削減率 |
|----------|------------|------------|---------|
| 現在 | - | 383MB | - |
| Phase 1完了後 | 300MB | 83MB | 78% |
| Phase 2完了後 | 450MB | 60MB | 84% |
| Phase 3完了後 | 500MB | 50MB | 87% |

## ⚠️ 削除時の注意点

### 機能への影響
- **Google Sheets連携**: googleapiclient削除で停止
- **PDF解析**: pdfminer削除で停止
- **データ分析**: pandas/numpy削除で停止
- **グラフ描画**: matplotlib削除で停止

### 推奨削除順序
1. **開発・テスト用ライブラリ** → 影響なし
2. **データサイエンス系** → CLI機能に影響なし
3. **画像・音声処理系** → CLI機能に影響なし
4. **条件付きライブラリ** → 機能確認後

## 🚀 次のアクション

1. **pyproject.toml編集** - 不要依存関係の削除
2. **ビルドスクリプト改良** - 最適化オプション追加
3. **機能テスト** - 削除後の動作確認
4. **サイズ測定** - 削減効果の確認

**目標**: 383MB → 50MB（87%削減）