@echo off
REM BlueLamp AI ワンクリックインストーラー v1.0 (Windows)
REM 対応OS: Windows 10/11 (PowerShell 5.0+)

setlocal enabledelayedexpansion

REM カラー設定（Windows 10以降）
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RED=%ESC%[31m"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "NC=%ESC%[0m"

echo %BLUE%🔵 BlueLamp AI ワンクリックインストーラー v1.0%NC%
echo ================================================
echo.

REM 管理者権限チェック
echo %BLUE%ℹ️  システム環境をチェック中...%NC%
net session >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ 管理者権限で実行されています%NC%
) else (
    echo %YELLOW%⚠️  一般ユーザーで実行されています（推奨: 管理者権限）%NC%
)

REM Python環境チェック
echo.
echo %BLUE%ℹ️  Python環境をチェック中...%NC%

REM python3 を優先的にチェック
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python3
    for /f "tokens=2" %%i in ('python3 --version 2^>^&1') do set PYTHON_VERSION=%%i
) else (
    REM python コマンドをチェック
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python
        for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    ) else (
        echo %RED%❌ Pythonが見つかりません%NC%
        echo.
        echo %BLUE%ℹ️  インストール方法:%NC%
        echo   1. Microsoft Store: "Python 3.12" を検索してインストール
        echo   2. 公式サイト: https://www.python.org/downloads/
        echo   3. Chocolatey: choco install python312
        echo.
        pause
        exit /b 1
    )
)

echo %GREEN%✅ Python !PYTHON_VERSION! が見つかりました%NC%

REM バージョンチェック（3.8以上）
%PYTHON_CMD% -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Python 3.8以上が必要です（現在: !PYTHON_VERSION!）%NC%
    pause
    exit /b 1
)

%PYTHON_CMD% -c "import sys; exit(0 if sys.version_info >= (3, 12) else 1)" >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ Python 3.12以上です（推奨バージョン）%NC%
) else (
    echo %YELLOW%⚠️  Python 3.8-3.11です。3.12以上を推奨しますが、動作します%NC%
)

REM pip環境チェック
echo.
echo %BLUE%ℹ️  pip環境をチェック中...%NC%

%PYTHON_CMD% -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ pipが見つかりません%NC%
    echo %BLUE%ℹ️  pipをインストール: %PYTHON_CMD% -m ensurepip --upgrade%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ pip が見つかりました%NC%

REM pipのアップグレード
echo %BLUE%ℹ️  pipを最新版にアップグレード中...%NC%
%PYTHON_CMD% -m pip install --upgrade pip --user --quiet
if %errorlevel% equ 0 (
    echo %GREEN%✅ pipのアップグレードが完了しました%NC%
)

REM BlueLamp AI インストール
echo.
echo %BLUE%ℹ️  BlueLamp AI をインストール中...%NC%
echo %YELLOW%⚠️  初回インストールは数分かかる場合があります...%NC%

%PYTHON_CMD% -m pip install --user bluelamp-ai --quiet
if %errorlevel% equ 0 (
    echo %GREEN%✅ BlueLamp AI のインストールが完了しました！%NC%
) else (
    echo %RED%❌ インストールに失敗しました%NC%
    echo.
    echo %BLUE%ℹ️  トラブルシューティング:%NC%
    echo   1. インターネット接続を確認してください
    echo   2. 管理者権限で実行してみてください
    echo   3. 手動インストール: %PYTHON_CMD% -m pip install --user bluelamp-ai
    echo.
    pause
    exit /b 1
)

REM PATH確認
echo.
echo %BLUE%ℹ️  実行パスを確認中...%NC%

REM ユーザーのScriptsディレクトリを取得
for /f "delims=" %%i in ('%PYTHON_CMD% -c "import site; print(site.USER_BASE + '\\Scripts')"') do set USER_SCRIPTS=%%i

echo %PATH% | findstr /C:"%USER_SCRIPTS%" >nul
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  PATHにユーザーScriptsディレクトリが含まれていません%NC%
    echo %BLUE%ℹ️  以下のディレクトリをPATHに追加することを推奨します:%NC%
    echo   %USER_SCRIPTS%
    echo.
    echo %BLUE%ℹ️  PATH追加方法:%NC%
    echo   1. 「システムのプロパティ」→「環境変数」
    echo   2. ユーザー環境変数の「Path」を編集
    echo   3. 「%USER_SCRIPTS%」を追加
) else (
    echo %GREEN%✅ PATHが正しく設定されています%NC%
)

REM 完了メッセージ
echo.
echo %GREEN%🎉 インストール完了！%NC%
echo ================================
echo.
echo %BLUE%📋 使用方法:%NC%
echo   ブルーランプ          # オーケストレーター起動
echo   ブルーランプ拡張      # 拡張マネージャー起動
echo   bluelamp --help      # 英語版ヘルプ
echo.
echo %BLUE%🔧 初期設定:%NC%
echo   初回起動時にAPIキーの設定が必要です
echo   対応AI: OpenAI, Anthropic, Google Gemini等
echo.
echo %BLUE%📚 ドキュメント:%NC%
echo   https://docs.bluelamp.ai
echo.
echo %BLUE%💡 問題が発生した場合:%NC%
echo   GitHub Issues: https://github.com/bluelamp-ai/cli/issues
echo.

echo %GREEN%✅ すべての処理が完了しました！%NC%
echo.
pause