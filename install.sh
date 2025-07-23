#!/bin/bash
# BlueLamp AI ワンクリックインストーラー v1.0
# 対応OS: macOS, Linux (Ubuntu, CentOS, Fedora等)

set -e  # エラー時に即座に終了

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# OS判定
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        log_info "macOS環境を検出しました"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        log_info "Linux環境を検出しました"
    else
        log_error "サポートされていないOS: $OSTYPE"
        exit 1
    fi
}

# Python環境チェック
check_python() {
    log_info "Python環境をチェック中..."
    
    # Python3の存在確認
    if ! command -v python3 &> /dev/null; then
        log_error "Python3が見つかりません"
        if [[ "$OS" == "macos" ]]; then
            log_info "インストール方法:"
            echo "  1. Homebrew: brew install python@3.12"
            echo "  2. 公式サイト: https://www.python.org/downloads/"
        else
            log_info "インストール方法:"
            echo "  Ubuntu/Debian: sudo apt update && sudo apt install python3 python3-pip"
            echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
            echo "  Fedora: sudo dnf install python3 python3-pip"
        fi
        exit 1
    fi
    
    # バージョンチェック
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    log_success "Python $PYTHON_VERSION が見つかりました"
    
    # 3.8以上をサポート（3.12推奨だが、より広い互換性のため）
    if python3 -c 'import sys; exit(0 if sys.version_info >= (3, 8) else 1)'; then
        if python3 -c 'import sys; exit(0 if sys.version_info >= (3, 12) else 1)'; then
            log_success "Python 3.12以上です（推奨バージョン）"
        else
            log_warning "Python 3.8-3.11です。3.12以上を推奨しますが、動作します"
        fi
    else
        log_error "Python 3.8以上が必要です（現在: $PYTHON_VERSION）"
        exit 1
    fi
}

# pip環境チェック
check_pip() {
    log_info "pip環境をチェック中..."
    
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3が見つかりません"
        if [[ "$OS" == "macos" ]]; then
            log_info "pipをインストール: python3 -m ensurepip --upgrade"
        else
            log_info "pipをインストール: sudo apt install python3-pip (Ubuntu)"
        fi
        exit 1
    fi
    
    log_success "pip3 が見つかりました"
    
    # pipのアップグレード
    log_info "pipを最新版にアップグレード中..."
    python3 -m pip install --upgrade pip --user --quiet
}

# BlueLamp AI インストール
install_bluelamp() {
    log_info "BlueLamp AI をインストール中..."
    log_warning "初回インストールは数分かかる場合があります..."
    
    # --userフラグでユーザーディレクトリにインストール
    if python3 -m pip install --user bluelamp-ai --quiet; then
        log_success "BlueLamp AI のインストールが完了しました！"
    else
        log_error "インストールに失敗しました"
        log_info "トラブルシューティング:"
        echo "  1. インターネット接続を確認してください"
        echo "  2. 管理者権限で実行してみてください"
        echo "  3. 手動インストール: pip3 install --user bluelamp-ai"
        exit 1
    fi
}

# PATHの確認と設定
check_path() {
    log_info "実行パスを確認中..."
    
    # ユーザーのbinディレクトリ
    if [[ "$OS" == "macos" ]]; then
        USER_BIN="$HOME/Library/Python/$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')/bin"
    else
        USER_BIN="$HOME/.local/bin"
    fi
    
    if [[ ":$PATH:" != *":$USER_BIN:"* ]]; then
        log_warning "PATHにユーザーbinディレクトリが含まれていません"
        log_info "以下をシェル設定ファイル（~/.bashrc, ~/.zshrc等）に追加してください:"
        echo "  export PATH=\"$USER_BIN:\$PATH\""
        
        # 自動追加の提案
        echo ""
        read -p "自動的に~/.bashrcに追加しますか？ (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "export PATH=\"$USER_BIN:\$PATH\"" >> ~/.bashrc
            log_success "~/.bashrcに追加しました。新しいターミナルで有効になります"
        fi
    else
        log_success "PATHが正しく設定されています"
    fi
}

# 使用方法の表示
show_usage() {
    echo ""
    echo "🎉 インストール完了！"
    echo "================================"
    echo ""
    echo "📋 使用方法:"
    echo "  ブルーランプ          # オーケストレーター起動"
    echo "  ブルーランプ拡張      # 拡張マネージャー起動"
    echo "  bluelamp --help      # 英語版ヘルプ"
    echo ""
    echo "🔧 初期設定:"
    echo "  初回起動時にAPIキーの設定が必要です"
    echo "  対応AI: OpenAI, Anthropic, Google Gemini等"
    echo ""
    echo "📚 ドキュメント:"
    echo "  https://docs.bluelamp.ai"
    echo ""
    echo "💡 問題が発生した場合:"
    echo "  GitHub Issues: https://github.com/bluelamp-ai/cli/issues"
}

# メイン実行
main() {
    echo "🔵 BlueLamp AI ワンクリックインストーラー v1.0"
    echo "================================================"
    echo ""
    
    detect_os
    check_python
    check_pip
    install_bluelamp
    check_path
    show_usage
    
    log_success "すべての処理が完了しました！"
}

# エラーハンドリング
trap 'log_error "インストール中にエラーが発生しました"; exit 1' ERR

# 実行
main "$@"