#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// エージェント設定
const agentConfigs = [
  {
    file: '05-implementation-consultant.md',
    name: 'implementation-consultant',
    triggers: ['実装計画', 'implementation', '実装', 'planning', 'コンサルタント', 'consultant', '計画']
  },
  {
    file: '06-environment-setup.md',
    name: 'environment-setup',
    triggers: ['環境構築', 'environment', 'setup', 'セットアップ', 'インストール', 'install', '環境設定']
  },
  {
    file: '07-prototype-implementation.md',
    name: 'prototype-implementation',
    triggers: ['プロトタイプ', 'prototype', '実装', 'implementation', 'MVP', '最小実装']
  },
  {
    file: '08-backend-implementation.md',
    name: 'backend-implementation',
    triggers: ['バックエンド', 'backend', 'サーバー', 'server', 'API', 'データベース', 'database']
  },
  {
    file: '09-test-quality-verification.md',
    name: 'test-quality-verification',
    triggers: ['テスト', 'test', '品質', 'quality', '検証', 'verification', 'QA', 'testing']
  },
  {
    file: '10-api-integration.md',
    name: 'api-integration',
    triggers: ['API統合', 'api integration', 'API', '統合', 'integration', 'エンドポイント', 'endpoint']
  },
  {
    file: '11-debug-detective.md',
    name: 'debug-detective',
    triggers: ['デバッグ', 'debug', 'バグ', 'bug', 'エラー', 'error', '問題解決', 'troubleshooting']
  },
  {
    file: '12-deploy-specialist.md',
    name: 'deploy-specialist',
    triggers: ['デプロイ', 'deploy', 'deployment', '本番', 'production', 'リリース', 'release']
  },
  {
    file: '13-github-manager.md',
    name: 'github-manager',
    triggers: ['GitHub', 'git', 'バージョン管理', 'version control', 'リポジトリ', 'repository']
  },
  {
    file: '14-typescript-manager.md',
    name: 'typescript-manager',
    triggers: ['TypeScript', 'typescript', '型エラー', 'type error', '型', 'types', 'TS']
  },
  {
    file: '15-feature-expansion.md',
    name: 'feature-expansion',
    triggers: ['機能追加', 'feature', '拡張', 'expansion', '新機能', 'enhancement']
  },
  {
    file: '16-refactoring-expert.md',
    name: 'refactoring-expert',
    triggers: ['リファクタリング', 'refactoring', 'コード改善', 'code improvement', '最適化', 'optimization']
  }
];

const sourceDir = '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/16agents';
const targetDir = '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/microagents/bluelamp';

// フロントマター生成
function generateFrontmatter(config) {
  return `---
name: ${config.name}
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
${config.triggers.map(trigger => `- ${trigger}`).join('\n')}
---

`;
}

// エージェント変換
agentConfigs.forEach(config => {
  const sourcePath = path.join(sourceDir, config.file);
  const targetPath = path.join(targetDir, config.name + '.md');

  try {
    // 元ファイル読み込み
    const content = fs.readFileSync(sourcePath, 'utf8');

    // フロントマター + 元コンテンツ
    const convertedContent = generateFrontmatter(config) + content;

    // 変換ファイル書き込み
    fs.writeFileSync(targetPath, convertedContent);

    console.log(`✅ 変換完了: ${config.file} → ${config.name}.md`);
  } catch (error) {
    console.error(`❌ 変換エラー: ${config.file}`, error.message);
  }
});

console.log('\n🎉 全エージェント変換完了！');
console.log(`📁 出力先: ${targetDir}`);
