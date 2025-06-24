#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { AgentLoader } from './agents/agentLoader';
import { RuleEngine } from './orchestrator/ruleEngine';
import { AgentExecutor } from './agents/agentExecutor';
import { ClaudeClient } from './tools/claudeClient';

// 環境変数読み込み
dotenv.config();

// バージョン情報
const VERSION = '3.0.0';

// グローバルインスタンス
let agentLoader: AgentLoader;
let ruleEngine: RuleEngine;

// 初期化
function initialize() {
  try {
    agentLoader = new AgentLoader();
    ruleEngine = new RuleEngine(agentLoader);

    // エージェント設定の検証
    const validation = agentLoader.validateAgentConfig();
    if (!validation.valid) {
      console.error(chalk.red('❌ エージェント設定にエラーがあります:'));
      validation.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
      process.exit(1);
    }

    console.log(chalk.green('✅ BlueLamp CLI 初期化完了'));
  } catch (error) {
    console.error(chalk.red(`❌ 初期化エラー: ${error}`));
    process.exit(1);
  }
}

// メインプログラム設定
program
  .version(VERSION)
  .description('BlueLamp CLI - マルチエージェントシステム v3.0.0')
  .hook('preAction', () => {
    initialize();
  });

// メインコマンド（引数なしまたはテキスト入力）
program
  .argument('[input]', 'タスクの説明')
  .option('-a, --agent <agentId>', '特定のエージェントを指定')
  .option('-w, --workflow <name>', 'ワークフローを指定')
  .option('-v, --verbose', '詳細な出力')
  .action(async (input: string, options: any) => {
    if (!input) {
      // インタラクティブモード
      await runInteractiveMode();
    } else {
      // 直接実行モード
      await runDirectMode(input, options);
    }
  });

// エージェント一覧コマンド
program
  .command('list')
  .alias('ls')
  .description('利用可能なエージェント一覧を表示')
  .option('-c, --category <category>', 'カテゴリでフィルタ')
  .option('-s, --stats', '統計情報を表示')
  .action((options: any) => {
    showAgentList(options);
  });

// エージェント詳細コマンド
program
  .command('info <agentId>')
  .description('エージェントの詳細情報を表示')
  .action((agentId: string) => {
    showAgentInfo(agentId);
  });

// ステータス確認コマンド
program
  .command('status')
  .description('システムの状態を表示')
  .action(() => {
    showSystemStatus();
  });

// 設定コマンド
program
  .command('config')
  .description('設定を表示・変更')
  .option('--show', '現在の設定を表示')
  .action((options: any) => {
    showConfig(options);
  });

/**
 * インタラクティブモード
 */
async function runInteractiveMode() {
  const inquirer = await import('inquirer');

  console.log(chalk.blue('🤖 BlueLamp CLI - インタラクティブモード'));
  console.log(chalk.gray('何をお手伝いしましょうか？'));

  const answers = await inquirer.default.prompt([
    {
      type: 'input',
      name: 'task',
      message: 'タスクを説明してください:',
      validate: (input: string) => input.trim().length > 0 || 'タスクの説明を入力してください'
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: '詳細な出力を表示しますか？',
      default: false
    }
  ]);

  await runDirectMode(answers.task, { verbose: answers.verbose });
}

/**
 * 直接実行モード
 */
async function runDirectMode(input: string, options: any) {
  try {
    console.log(chalk.blue('🚀 タスク実行開始'));
    console.log(chalk.gray(`入力: ${input}`));

    if (options.verbose) {
      console.log(chalk.gray(`オプション: ${JSON.stringify(options, null, 2)}`));
    }

    // Phase 1: 基本実装（単一エージェント実行）
    const userInput = {
      text: input,
      options: {
        agent: options.agent,
        workflow: options.workflow,
        verbose: options.verbose
      }
    };

    // 入力分析
    console.log(chalk.yellow('📊 入力を分析中...'));
    const analysis = await ruleEngine.analyzeInput(userInput);

    if (options.verbose) {
      console.log(chalk.gray('分析結果:'));
      console.log(chalk.gray(`  意図: ${analysis.intent}`));
      console.log(chalk.gray(`  キーワード: ${analysis.keywords.join(', ')}`));
      console.log(chalk.gray(`  推奨エージェント: ${analysis.suggestedAgents.join(', ')}`));
      console.log(chalk.gray(`  信頼度: ${(analysis.confidence * 100).toFixed(1)}%`));
    }

    // タスク生成
    console.log(chalk.yellow('📋 タスクを生成中...'));
    const tasks = await ruleEngine.generateTasks(analysis, userInput);

    if (options.verbose) {
      console.log(chalk.gray(`生成されたタスク数: ${tasks.length}`));
      tasks.forEach((task, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${task.agentId} - ${task.priority} priority`));
      });
    }

    // 実行計画作成
    console.log(chalk.yellow('📅 実行計画を作成中...'));
    const executionPlan = await ruleEngine.createExecutionPlan(tasks);

    console.log(chalk.green('✅ 実行計画完成'));
    console.log(chalk.blue(`📊 フェーズ数: ${executionPlan.phases.length}`));
    console.log(chalk.blue(`⏱️  推定時間: ${Math.round(executionPlan.totalEstimatedDuration / 60)}分`));

    // フェーズ詳細表示
    executionPlan.phases.forEach((phase, index) => {
      console.log(chalk.cyan(`\n📌 ${phase.name}`));
      console.log(chalk.gray(`   並列実行: ${phase.parallel ? 'はい' : 'いいえ'}`));
      console.log(chalk.gray(`   タスク数: ${phase.tasks.length}`));

      phase.tasks.forEach(task => {
        const agentInfo = agentLoader.getAgentInfo(task.agentId);
        console.log(chalk.white(`   • ${task.agentId} ${agentInfo?.name || 'Unknown'}`));
      });
    });

    // Claude API設定チェック
    try {
      const claudeClient = new ClaudeClient();
      const isConfigured = await claudeClient.isConfigured();

      if (!isConfigured) {
        console.log(chalk.red('\n❌ Claude API キーが設定されていません'));
        console.log(chalk.yellow('実行するには .env ファイルに CLAUDE_API_KEY を設定してください'));
        console.log(chalk.gray('例: CLAUDE_API_KEY=sk-ant-api03-...'));
        return;
      }

      // 実際の実行を開始
      console.log(chalk.green('\n🚀 エージェント実行を開始します...\n'));

      const executor = new AgentExecutor();
      const allTasks = executionPlan.phases.flatMap(phase => phase.tasks);

      const results = await executor.executeAgentSequence(allTasks, input);

      // 結果サマリー
      console.log(chalk.blue('\n📊 実行結果サマリー'));
      console.log(`✅ 成功: ${results.filter(r => r.success).length}/${results.length}`);
      console.log(`❌ 失敗: ${results.filter(r => !r.success).length}/${results.length}`);

      const totalFiles = results.reduce((sum, r) => sum + r.files.length, 0);
      const totalCommands = results.reduce((sum, r) => sum + r.commands.length, 0);

      if (totalFiles > 0) {
        console.log(`📄 作成されたファイル: ${totalFiles}個`);
      }
      if (totalCommands > 0) {
        console.log(`⚡ 実行されたコマンド: ${totalCommands}個`);
      }

      console.log(chalk.green('\n🎉 タスク実行完了！'));

    } catch (apiError) {
      console.log(chalk.red('\n❌ エラーが発生しました:'));
      console.log(chalk.red(apiError instanceof Error ? apiError.message : String(apiError)));

      if (apiError instanceof Error && apiError.message.includes('CLAUDE_API_KEY')) {
        console.log(chalk.yellow('\n💡 Claude API キーを設定してください:'));
        console.log(chalk.gray('1. .env ファイルを作成'));
        console.log(chalk.gray('2. CLAUDE_API_KEY=your-api-key を追加'));
        console.log(chalk.gray('3. 再度実行'));
      }
    }

  } catch (error) {
    console.error(chalk.red(`❌ エラー: ${error}`));
    process.exit(1);
  }
}

/**
 * エージェント一覧表示
 */
function showAgentList(options: any) {
  const agents = options.category
    ? agentLoader.getAgentsByCategory(options.category)
    : agentLoader.getAllAgents();

  if (agents.length === 0) {
    console.log(chalk.yellow(`カテゴリ '${options.category}' のエージェントが見つかりません`));
    return;
  }

  console.log(chalk.blue(`\n🤖 エージェント一覧 (${agents.length}件)`));

  if (options.stats) {
    const stats = agentLoader.getAgentStats();
    console.log(chalk.gray(`\n📊 統計情報:`));
    console.log(chalk.gray(`  総数: ${stats.total}`));
    console.log(chalk.gray(`  依存関係あり: ${stats.withDependencies}`));
    console.log(chalk.gray(`  独立: ${stats.independent}`));
    console.log(chalk.gray(`  カテゴリ別:`));
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(chalk.gray(`    ${category}: ${count}`));
    });
  }

  console.log();
  agents.forEach(agent => {
    const dependencyInfo = agent.dependencies.length > 0
      ? chalk.gray(` (依存: ${agent.dependencies.join(', ')})`)
      : '';

    console.log(`${chalk.cyan(agent.id)} ${chalk.white(agent.name)}`);
    console.log(`  ${chalk.gray(agent.description)}${dependencyInfo}`);
    console.log(`  ${chalk.yellow(`[${agent.category}]`)} ${chalk.green(agent.tools.join(', '))}`);
    console.log();
  });
}

/**
 * エージェント詳細表示
 */
function showAgentInfo(agentId: string) {
  const agent = agentLoader.getAgentInfo(agentId);

  if (!agent) {
    console.error(chalk.red(`❌ エージェント '${agentId}' が見つかりません`));
    return;
  }

  console.log(chalk.blue(`\n🤖 ${agent.id} - ${agent.name}`));
  console.log(chalk.gray(`説明: ${agent.description}`));
  console.log(chalk.yellow(`カテゴリ: ${agent.category}`));
  console.log(chalk.green(`ツール: ${agent.tools.join(', ')}`));
  console.log(chalk.cyan(`プロンプトファイル: ${agent.promptFile}`));

  if (agent.dependencies.length > 0) {
    console.log(chalk.magenta(`依存関係: ${agent.dependencies.join(', ')}`));
  }

  if (agent.outputs.length > 0) {
    console.log(chalk.blue(`出力ファイル: ${agent.outputs.join(', ')}`));
  }

  // 依存するエージェントを表示
  const dependentAgents = agentLoader.getDependentAgents(agentId);
  if (dependentAgents.length > 0) {
    console.log(chalk.gray(`このエージェントに依存: ${dependentAgents.join(', ')}`));
  }
}

/**
 * システム状態表示
 */
function showSystemStatus() {
  console.log(chalk.blue('\n📊 システム状態'));

  const stats = agentLoader.getAgentStats();
  console.log(chalk.green(`✅ エージェント: ${stats.total}個 読み込み済み`));

  // 環境変数チェック
  const hasClaudeKey = !!process.env.CLAUDE_API_KEY;
  console.log(hasClaudeKey
    ? chalk.green('✅ Claude API キー: 設定済み')
    : chalk.red('❌ Claude API キー: 未設定')
  );

  console.log(chalk.blue(`🏗️  実装状況: Phase 1 (基本オーケストレーション)`));
  console.log(chalk.yellow('⚠️  エージェント実行機能は開発中'));
}

/**
 * 設定表示
 */
function showConfig(options: any) {
  console.log(chalk.blue('\n⚙️  設定情報'));

  if (options.show) {
    console.log(chalk.gray('環境変数:'));
    console.log(chalk.gray(`  CLAUDE_API_KEY: ${process.env.CLAUDE_API_KEY ? '設定済み' : '未設定'}`));
    console.log(chalk.gray(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`));
  }

  console.log(chalk.gray('設定ファイル:'));
  console.log(chalk.gray('  エージェント: ./config/agents.json'));
  console.log(chalk.gray('  16エージェント: ./16agents/'));
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error(chalk.red(`❌ 予期しないエラー: ${error.message}`));
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`❌ 未処理のPromise拒否: ${reason}`));
  process.exit(1);
});

// プログラム実行
program.parse();
