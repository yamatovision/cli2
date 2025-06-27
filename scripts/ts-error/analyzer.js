#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const tasksPath = path.join(__dirname, 'tasks.json');
const logsDir = path.join(__dirname, 'logs');
const errorsPath = path.join(logsDir, 'errors_latest.json');

// ログディレクトリの作成
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// tasks.json読み込みと25分ルールチェック
const checkTasksStatus = () => {
  if (!fs.existsSync(tasksPath)) {
    fs.writeFileSync(tasksPath, JSON.stringify({
      updated: new Date().toLocaleString(),
      working: {}
    }, null, 2));
    return;
  }

  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  const now = Date.now();

  console.log('\n=== 作業中タスク確認 ===');
  const workingTasks = Object.entries(tasks.working);
  
  if (workingTasks.length === 0) {
    console.log('現在作業中のタスクはありません');
  } else {
    for (const [agent, task] of workingTasks) {
      const elapsed = now - new Date(task.startedAt).getTime();
      const minutes = Math.floor(elapsed / (60 * 1000));
      
      console.log(`📝 ${agent}: ${task.error} (${minutes}分経過)`);
      
      if (elapsed > 25 * 60 * 1000) { // 25分
        console.log(`⚠️  警告: ${agent}の作業が25分を超過しています`);
        console.log(`   → ${task.error}は放棄されたとみなされます`);
      }
    }
  }
  console.log('========================\n');
};

// 設定エラー耐性チェック
const performRobustCheck = (command, projectPath) => {
  try {
    const output = execSync(command, { 
      cwd: projectPath,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output, errors: [] };
  } catch (error) {
    const output = error.stdout || error.stderr || '';

    // 設定エラーを検出しつつエラーを抽出
    if (output.includes('is not under \'rootDir\'') ||
        output.includes('TS6059') ||
        output.includes('Cannot find tsconfig.json')) {
      console.log('⚠️  設定問題を検出 - エラー抽出を継続');
    }

    return { success: false, output };
  }
};

// TypeScriptエラーの収集
const collectTypeScriptErrors = () => {
  const errors = [];
  const projects = [
    {
      name: 'vscode-extension',
      path: path.join(projectRoot, 'vscode-extension'),
      hasTypeScript: true,
      command: 'npm run compile'
    },
    {
      name: 'portal/frontend',
      path: path.join(projectRoot, 'portal/frontend'),
      hasTypeScript: false
    },
    {
      name: 'portal/backend',
      path: path.join(projectRoot, 'portal/backend'),
      hasTypeScript: false
    }
  ];

  console.log('🔍 TypeScriptエラーを収集中...\n');

  for (const project of projects) {
    console.log(`📁 ${project.name} をチェック中...`);
    
    if (!fs.existsSync(project.path)) {
      console.log(`   ❌ プロジェクトパスが存在しません: ${project.path}`);
      continue;
    }

    if (!project.hasTypeScript) {
      console.log(`   ℹ️  JavaScriptプロジェクト - TypeScriptチェックをスキップ`);
      continue;
    }

    // TypeScriptコンパイルチェック
    const tscCommand = project.command || 'npx tsc --noEmit --skipLibCheck';
    const result = performRobustCheck(tscCommand, project.path);
    
    if (!result.success && result.output) {
      // エラーパターンの解析
      const lines = result.output.split('\n');
      for (const line of lines) {
        if (line.includes('[tsl] ERROR in')) {
          // webpack ts-loader形式のエラーパターン
          const match = line.match(/\[tsl\] ERROR in (.+?)\((\d+),(\d+)\)\s+(TS\d+): (.+)/);
          if (match) {
            errors.push({
              project: project.name,
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              code: match[4],
              message: match[5],
              fullLine: line
            });
          }
        } else if (line.includes('error TS')) {
          // 標準的なTypeScriptエラーパターン
          const match = line.match(/(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/);
          if (match) {
            errors.push({
              project: project.name,
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              code: match[4],
              message: match[5],
              fullLine: line
            });
          }
        }
      }
    }
    
    console.log(`   ✅ チェック完了`);
  }

  return errors;
};

// メイン実行
const main = () => {
  console.log('🚀 TypeScriptエラー分析を開始します...\n');
  
  // 作業中タスクの確認
  checkTasksStatus();
  
  // エラー収集
  const errors = collectTypeScriptErrors();
  
  // エラーサマリーの表示
  console.log('\n=== エラーサマリー ===');
  console.log(`📊 総エラー数: ${errors.length}`);
  
  if (errors.length === 0) {
    console.log('🎉 TypeScriptエラーは見つかりませんでした！');
  } else {
    console.log('\n📋 エラー詳細:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.project}] ${error.code}: ${error.file}:${error.line}:${error.column}`);
      console.log(`   ${error.message}`);
    });
  }
  
  // エラーログの保存
  const errorReport = {
    timestamp: new Date().toLocaleString(),
    totalErrors: errors.length,
    errors: errors,
    projects: {
      'vscode-extension': errors.filter(e => e.project === 'vscode-extension').length,
      'portal/frontend': errors.filter(e => e.project === 'portal/frontend').length,
      'portal/backend': errors.filter(e => e.project === 'portal/backend').length
    }
  };
  
  fs.writeFileSync(errorsPath, JSON.stringify(errorReport, null, 2));
  console.log(`\n💾 エラーレポートを保存しました: ${errorsPath}`);
  
  // tasks.jsonの更新
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  tasks.updated = new Date().toLocaleString();
  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  
  console.log('===================\n');
};

// 実行
main();