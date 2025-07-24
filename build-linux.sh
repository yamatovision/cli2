#!/bin/bash
# Linux用バイナリをDockerでビルドするスクリプト

echo "Building Linux binary using Docker..."

# Dockerイメージをビルド
docker build -f Dockerfile.linux-build -t bluelamp-linux-builder .

# 出力ディレクトリを作成
mkdir -p dist-linux

# コンテナを実行してバイナリを取り出す
docker run --rm -v $(pwd)/dist-linux:/output bluelamp-linux-builder

echo "Linux binary built successfully!"
echo "Binary location: dist-linux/bluelamp"

# 実行権限を付与
chmod +x dist-linux/bluelamp

echo "Testing the binary..."
./dist-linux/bluelamp --version