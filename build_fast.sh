#!/bin/bash
# BlueLamp 高速起動バイナリビルドスクリプト

echo "高速起動バイナリをビルドします..."

# --onedir形式で高速化
poetry run pyinstaller \
    --name bluelamp-fast \
    --onedir \
    --add-data "core/config:core/config" \
    --hidden-import tiktoken_ext.openai_public \
    --exclude-module matplotlib \
    --exclude-module pandas \
    --exclude-module numpy \
    --exclude-module PIL \
    --exclude-module cv2 \
    --exclude-module scipy \
    --exclude-module torch \
    --exclude-module tensorflow \
    --optimize 2 \
    test_binary.py

echo "高速起動バイナリ完成！"
echo "実行方法: ./dist/bluelamp-fast/bluelamp-fast"
