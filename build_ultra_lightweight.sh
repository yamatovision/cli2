#!/bin/bash
# BlueLamp CLI 超軽量バイナリビルドスクリプト
# 実際に使用する機能のみに特化

echo "🚀 BlueLamp CLI 超軽量バイナリビルダー"
echo "=================================================="

# 1. クリーンアップ
echo -e "\n1. ビルドディレクトリのクリーンアップ"
rm -rf build dist __pycache__
echo "✓ クリーンアップ完了"

# 2. PyInstallerの確認とインストール
echo -e "\n2. PyInstallerの確認とインストール"
poetry run pip install pyinstaller

# 3. 超軽量ビルド実行
echo -e "\n3. 超軽量バイナリのビルド"
poetry run pyinstaller \
    --name bluelamp-lite \
    --onefile \
    --clean \
    --noconfirm \
    --optimize 2 \
    --strip \
    --exclude-module matplotlib \
    --exclude-module pandas \
    --exclude-module numpy \
    --exclude-module PIL \
    --exclude-module Pillow \
    --exclude-module cv2 \
    --exclude-module opencv-python \
    --exclude-module opencv-python-headless \
    --exclude-module scipy \
    --exclude-module sklearn \
    --exclude-module torch \
    --exclude-module tensorflow \
    --exclude-module jupyter \
    --exclude-module notebook \
    --exclude-module IPython \
    --exclude-module qtconsole \
    --exclude-module PyQt5 \
    --exclude-module PyQt6 \
    --exclude-module tkinter \
    --exclude-module wx \
    --exclude-module gtk \
    --exclude-module plotly \
    --exclude-module seaborn \
    --exclude-module bokeh \
    --exclude-module dash \
    --exclude-module streamlit \
    --exclude-module gradio \
    --exclude-module flask \
    --exclude-module django \
    --exclude-module fastapi.staticfiles \
    --exclude-module uvicorn.main \
    --exclude-module speech_recognition \
    --exclude-module pydub \
    --exclude-module moviepy \
    --exclude-module ffmpeg \
    --exclude-module imageio \
    --exclude-module reportlab \
    --exclude-module openpyxl \
    --exclude-module xlsxwriter \
    --exclude-module xlrd \
    --exclude-module pyodbc \
    --exclude-module psycopg2 \
    --exclude-module pymongo \
    --exclude-module redis \
    --exclude-module celery \
    --exclude-module gevent \
    --hidden-import tiktoken_ext.openai_public \
    --collect-data tiktoken \
    --collect-data litellm \
    --add-data "core/config:core/config" \
    test_binary.py

# 4. 結果確認
echo -e "\n=================================================="
if [ -f "dist/bluelamp-lite" ]; then
    echo "✅ 超軽量ビルドが正常に完了しました！"
    
    # サイズ比較
    OLD_SIZE=$(ls -la dist/bluelamp 2>/dev/null | awk '{print $5}' || echo "0")
    NEW_SIZE=$(ls -la dist/bluelamp-lite | awk '{print $5}')
    OLD_MB=$(echo "scale=1; $OLD_SIZE / 1024 / 1024" | bc -l 2>/dev/null || echo "0")
    NEW_MB=$(echo "scale=1; $NEW_SIZE / 1024 / 1024" | bc -l)
    
    echo ""
    echo "📊 サイズ比較:"
    if [ "$OLD_SIZE" != "0" ]; then
        echo "  従来版: ${OLD_MB}MB"
    fi
    echo "  軽量版: ${NEW_MB}MB"
    
    if [ "$OLD_SIZE" != "0" ] && [ $(echo "$OLD_SIZE > 0" | bc -l) -eq 1 ]; then
        REDUCTION=$(echo "scale=1; (1 - $NEW_SIZE / $OLD_SIZE) * 100" | bc -l)
        echo "  削減率: ${REDUCTION}%"
    fi
    
    echo ""
    echo "🎯 バイナリの場所: $(pwd)/dist/bluelamp-lite"
    echo ""
    echo "動作テスト方法:"
    echo "  ./dist/bluelamp-lite --version"
    echo "  ./dist/bluelamp-lite --help"
    echo "  ./dist/bluelamp-lite"
else
    echo "❌ ビルドに失敗しました"
    exit 1
fi