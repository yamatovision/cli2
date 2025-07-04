#!/bin/bash
# BlueLamp CLIリリーススクリプト (GitHub Releases対応)

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# バージョンタイプを確認
if [ -z "$1" ]; then
    echo -e "${YELLOW}使用方法: $0 [patch|minor|major|VERSION]${NC}"
    echo ""
    echo "  patch - バグ修正 (0.45.0 → 0.45.1)"
    echo "  minor - 新機能追加 (0.45.0 → 0.46.0)"
    echo "  major - 破壊的変更 (0.45.0 → 1.0.0)"
    echo "  VERSION - 具体的なバージョン (例: 1.0.0)"
    echo ""
    echo -e "${BLUE}注意: このスクリプトはGitHub Releasesでの配布に対応しています${NC}"
    exit 1
fi

VERSION_TYPE=$1

# 現在のバージョンを取得
CURRENT_VERSION=$(poetry version -s)
echo -e "${GREEN}現在のバージョン: $CURRENT_VERSION${NC}"

# バージョンを更新
echo -e "${YELLOW}バージョンを更新中...${NC}"
poetry version $VERSION_TYPE

# 新しいバージョンを取得
NEW_VERSION=$(poetry version -s)
echo -e "${GREEN}新しいバージョン: $NEW_VERSION${NC}"

# 変更をコミット
echo -e "${YELLOW}変更をコミット中...${NC}"
git add pyproject.toml
git commit -m "chore: bump version from $CURRENT_VERSION to $NEW_VERSION"

# タグを作成
echo -e "${YELLOW}タグを作成中...${NC}"
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# ゴミファイル生成とビルド
echo -e "${YELLOW}リリースビルドを実行中...${NC}"
python3 scripts/build_release.py --project-root .

# ビルド結果の確認
echo -e "${YELLOW}以下の内容でGitHub Releasesに公開します:${NC}"
echo -e "  バージョン: ${GREEN}$NEW_VERSION${NC}"
echo -e "  ファイル:"
ls -la dist/

read -p "GitHub Releasesでの公開を続行しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Gitにプッシュ（GitHub Actionsがトリガーされる）
    echo -e "${YELLOW}Gitにプッシュ中...${NC}"
    git push
    git push --tags
    
    echo -e "${GREEN}✅ リリース準備完了！${NC}"
    echo -e "${GREEN}GitHub Actionsが自動的にリリースを作成します${NC}"
    echo -e "${BLUE}進捗確認: https://github.com/BlueLamp-AI/BlueLamp/actions${NC}"
    echo -e "${BLUE}リリース確認: https://github.com/BlueLamp-AI/BlueLamp/releases${NC}"
    
    # PyPI公開オプション
    echo ""
    read -p "PyPIにも公開しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}PyPIに公開中...${NC}"
        poetry publish
        echo -e "${GREEN}PyPI: https://pypi.org/project/bluelamp-ai/$NEW_VERSION/${NC}"
    fi
else
    echo -e "${RED}リリースをキャンセルしました${NC}"
    # バージョンを元に戻す
    git reset --hard HEAD~1
    git tag -d "v$NEW_VERSION"
    
fi