#!/usr/bin/env node

/**
 * 16エージェントの統合プロンプトを作成するスクリプト
 * requirements_engineer.j2に直接置き換え可能な形式で出力
 */

const fs = require('fs').promises;
const path = require('path');

const agents = [
  "01-requirements-engineer.md",
  "02-uiux-designer.md",
  "03-data-modeling-engineer.md",
  "04-system-architect.md",
  "05-implementation-consultant.md",
  "06-environment-setup.md",
  "07-prototype-implementation.md",
  "08-backend-implementation.md",
  "09-test-quality-verification.md",
  "10-api-integration.md",
  "11-debug-detective.md",
  "12-deploy-specialist.md",
  "13-github-manager.md",
  "14-typescript-manager.md",
  "15-feature-expansion.md",
  "16-refactoring-expert.md"
];

async function createUnifiedPrompt() {
  console.log('Creating unified 16-agent prompt...\n');

  let unifiedContent = `{# BlueLamp 16エージェント統合システムプロンプト #}

<system_prompt>
あなたは「BlueLamp」- 16種類の専門エージェントが統合されたAI開発アシスタントです。

# 初回挨拶（必ず最初に送信）
ユーザーとの会話開始時、または「あなたは誰？」と聞かれた際は、必ず以下の挨拶をしてください：

「こんにちは！私はBlueLamp - 16エージェント統合AIです。プロジェクトの要件定義から実装、デプロイまで、開発のあらゆる段階をサポートします。まずは、今回のプロジェクトについて教えてください。新しいプロジェクトを始めますか？それとも既存プロジェクトの改善を行いますか？」

## 統合エージェント一覧

`;

  // 各エージェントのプロンプトを読み込んで統合
  for (const agentFile of agents) {
    try {
      const filepath = path.join(__dirname, agentFile);
      const content = await fs.readFile(filepath, 'utf8');

      // ヘッダー部分を抽出（# ★X エージェント名の行）
      const lines = content.split('\n');
      const headerLine = lines.find(line => line.startsWith('# ★'));

      if (headerLine) {
        unifiedContent += `${headerLine}\n`;

        // プロンプト内容を抽出（最初の---まで）
        const startIndex = lines.findIndex(line => line.startsWith('# ★'));
        const endIndex = lines.findIndex((line, index) => index > startIndex && line.trim() === '---');

        if (startIndex !== -1 && endIndex !== -1) {
          const agentContent = lines.slice(startIndex + 1, endIndex).join('\n').trim();
          unifiedContent += `${agentContent}\n\n`;
        }
      }

      console.log(`✅ Processed ${agentFile}`);
    } catch (error) {
      console.error(`❌ Failed to process ${agentFile}:`, error.message);
    }
  }

  // フッター部分を追加
  unifiedContent += `
## 使用可能なツール
{% if cmd_enabled %}
- **execute_bash**: コマンド実行、ディレクトリ作成、ファイル操作
{% endif %}
{% if edit_enabled %}
- **str_replace_editor**: ファイルの作成と編集
{% endif %}
{% if browser_enabled %}
- **browser**: ブラウザ操作、Webページの表示
{% endif %}
- **execute_ipython_cell**: Python コード実行
- **think**: 複雑な推論や計画立案
- **finish**: タスク完了の報告

## 動作原則
1. **適切なエージェントの選択**: タスクに最も適したエージェントの専門知識を活用
2. **段階的なアプローチ**: 複雑なタスクを適切な順序で分解
3. **品質重視**: 効率性よりも正確性と品質を優先
4. **ユーザー中心**: 常にユーザーの目標達成を最優先
5. **継続的改善**: フィードバックを受けて継続的に改善

## 成果物の管理
- 要件定義書: \`docs/requirements.md\`
- 設計書: \`docs/design.md\`
- API仕様書: \`docs/api.md\`
- テスト計画: \`docs/testing.md\`
- デプロイ手順: \`docs/deployment.md\`

常にユーザーの成功を最優先に考え、16エージェントの専門知識を統合して最高品質のソリューションを提供してください。
</system_prompt>
`;

  // 統合プロンプトをファイルに保存
  const outputPath = path.join(__dirname, 'unified-16agents-prompt.j2');
  await fs.writeFile(outputPath, unifiedContent, 'utf8');

  console.log(`\n✨ Unified prompt created: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Copy this file to replace requirements_engineer.j2');
  console.log('2. Disable repo_instructions injection');
  console.log('3. Test the simplified single-stage prompt system');
}

// 実行
createUnifiedPrompt().catch(console.error);
