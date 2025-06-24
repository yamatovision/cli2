#!/usr/bin/env node

/**
 * BlueLamp 16エージェントのプロンプトを取得するスクリプト
 */

const fs = require('fs').promises;
const path = require('path');

// エージェント情報とURL
const agents = [
  {
    id: 1,
    name: "要件定義エンジニア",
    filename: "01-requirements-engineer.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39"
  },
  {
    id: 2,
    name: "UIUXデザイナー（モックアップ作成）",
    filename: "02-uiux-designer.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/8cdfe9875a5ab58ea5cdef0ba52ed8eb"
  },
  {
    id: 3,
    name: "データモデリングエンジニア",
    filename: "03-data-modeling-engineer.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/9575d0837e6b7700ab2f8887a5c4faec"
  },
  {
    id: 4,
    name: "システムアーキテクト",
    filename: "04-system-architect.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/f0f6805b80ae32f3846c35fe9df4eefe"
  },
  {
    id: 5,
    name: "実装計画コンサルタント",
    filename: "05-implementation-consultant.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/44b995b91e9879080c4e0169e7a51c0e"
  },
  {
    id: 6,
    name: "環境構築",
    filename: "06-environment-setup.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/50eb4d1e924c9139ef685c2f39766589"
  },
  {
    id: 7,
    name: "プロトタイプ実装",
    filename: "07-prototype-implementation.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/e6167ac13d15f778c0cae369b0068813"
  },
  {
    id: 8,
    name: "バックエンド実装",
    filename: "08-backend-implementation.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/b168dcd63cc12e15c2e57bce02caf704"
  },
  {
    id: 9,
    name: "テスト品質検証",
    filename: "09-test-quality-verification.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/5a3f08098fd5b7846602e9b5446b7d44"
  },
  {
    id: 10,
    name: "API統合",
    filename: "10-api-integration.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/dc8d5407c9e0becc95af38d91acb22cd"
  },
  {
    id: 11,
    name: "デバッグ探偵",
    filename: "11-debug-detective.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/942ec5f5b316b3fb11e2fd2b597bfb09"
  },
  {
    id: 12,
    name: "デプロイ",
    filename: "12-deploy-specialist.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/612fc1991ca477744c4544255d40fe0b"
  },
  {
    id: 13,
    name: "GitHub",
    filename: "13-github-manager.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/868ba99fc6e40d643a02e0e02c5e980a"
  },
  {
    id: 14,
    name: "型エラー解決（TypeScript）",
    filename: "14-typescript-manager.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/247df2890160a2fa8f6cc0f895413aed"
  },
  {
    id: 15,
    name: "機能追加",
    filename: "15-feature-expansion.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/8c09f971e4a3d020497eec099a53e0a6"
  },
  {
    id: 16,
    name: "リファクタリング",
    filename: "16-refactoring-expert.md",
    url: "http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/af9d922c29beffe1224ac6236d083946"
  }
];

async function fetchPrompt(agent) {
  try {
    console.log(`Fetching ★${agent.id} ${agent.name}...`);

    const response = await fetch(agent.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // プロンプト内容を整形
    const content = `# ★${agent.id} ${agent.name}

${data.content || data.prompt || JSON.stringify(data, null, 2)}

---
Source: ${agent.url}
Fetched: ${new Date().toISOString()}
`;

    // ファイルに保存
    const filepath = path.join(__dirname, agent.filename);
    await fs.writeFile(filepath, content, 'utf8');

    console.log(`✅ Saved to ${agent.filename}`);

    // APIレート制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (error) {
    console.error(`❌ Failed to fetch ★${agent.id} ${agent.name}:`, error.message);
  }
}

async function fetchAllPrompts() {
  console.log('Starting to fetch all 16 agent prompts...\n');

  for (const agent of agents) {
    await fetchPrompt(agent);
  }

  console.log('\n✨ All prompts fetching completed!');

  // INDEX.mdを作成
  const indexContent = `# BlueLamp 16 Agents Prompts

このディレクトリには、BlueLamp CLIで使用される16種類のエージェントのプロンプトが含まれています。

## エージェント一覧

${agents.map(a => `- [★${a.id} ${a.name}](./${a.filename})`).join('\n')}

## 使用方法

各ファイルには、対応するエージェントの完全なプロンプトが含まれています。
これらのプロンプトは、BlueLamp CLIのマルチエージェントシステムで使用されます。

## 更新日時

最終更新: ${new Date().toISOString()}
`;

  await fs.writeFile(path.join(__dirname, 'INDEX.md'), indexContent, 'utf8');
  console.log('📄 Created INDEX.md');
}

// 実行
fetchAllPrompts().catch(console.error);
