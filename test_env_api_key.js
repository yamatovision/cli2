/**
 * AppGeniusの環境変数やClaude CLI設定を確認するスクリプト
 */
require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// コマンドラインカラー定義
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

/**
 * 秘密鍵の一部をマスクする
 * @param {string} key - 秘密鍵
 * @returns {string} - マスクされた秘密鍵
 */
function maskKey(key) {
  if (!key) return 'undefined';
  if (typeof key !== 'string') return typeof key;
  
  // 長さが10未満なら完全にマスク
  if (key.length < 10) return '********';
  
  // 先頭12文字と最後4文字を保持し、それ以外をマスク
  const prefix = key.substring(0, 12);
  const suffix = key.substring(key.length - 4);
  return `${prefix}...${suffix}`;
}

/**
 * 認証ファイルを読み込む
 * @param {string} filePath - ファイルパス
 * @returns {object|null} - 読み込まれたJSONデータ
 */
function readAuthFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log(colors.red(`${filePath} の読み込みに失敗: ${error.message}`));
  }
  return null;
}

/**
 * .clauderc ファイルを確認
 */
function checkClaudeRc() {
  console.log(colors.cyan('\n.clauderc ファイルを確認中...'));
  
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const claudeRcPath = path.join(homeDir, '.clauderc');
  
  try {
    if (fs.existsSync(claudeRcPath)) {
      console.log(colors.green('.clauderc ファイルが存在します'));
      const data = fs.readFileSync(claudeRcPath, 'utf8');
      
      // JSONまたはYAML形式かどうかを判断
      let config = null;
      try {
        config = JSON.parse(data);
        console.log('JSON形式で保存されています');
      } catch {
        console.log('テキスト形式で保存されています');
        // テキスト形式の場合は行ごとに解析
        const lines = data.split('\n');
        lines.forEach(line => {
          console.log(`  ${line}`);
        });
      }
      
      if (config) {
        // JSONオブジェクトの内容を表示
        console.log('設定内容:');
        Object.keys(config).forEach(key => {
          if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
            console.log(`  ${key}: ${maskKey(config[key])}`);
          } else {
            console.log(`  ${key}: ${config[key]}`);
          }
        });
      }
    } else {
      console.log(colors.yellow('.clauderc ファイルが見つかりません'));
    }
  } catch (error) {
    console.log(colors.red(`エラー: ${error.message}`));
  }
}

/**
 * Claude CLIの情報を確認
 */
function checkClaudeCli() {
  console.log(colors.cyan('\nClaude CLIの情報を確認中...'));
  
  // Claude CLIのバージョンを確認
  exec('claude --version', (error, stdout, stderr) => {
    if (error) {
      console.log(colors.yellow('Claude CLIがインストールされていないか、PATHに含まれていません'));
      return;
    }
    
    console.log(colors.green('Claude CLI情報:'));
    console.log(`  バージョン: ${stdout.trim()}`);
    
    // Claude CLIの設定を確認
    exec('claude config show', (configError, configStdout, configStderr) => {
      if (configError) {
        console.log(colors.yellow('Claude CLI設定を確認できませんでした'));
        return;
      }
      
      console.log('  設定情報:');
      const lines = configStdout.split('\n');
      lines.forEach(line => {
        // APIキーがある行はマスクする
        if (line.includes('api_key') || line.includes('token')) {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            console.log(`    ${key}: ${maskKey(value)}`);
          } else {
            console.log(`    ${line}`);
          }
        } else {
          console.log(`    ${line}`);
        }
      });
    });
  });
}

/**
 * AppGeniusが使用する認証ファイルを確認
 */
function checkAppGeniusAuthFiles() {
  console.log(colors.cyan('\nAppGenius認証ファイルを確認中...'));
  
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const appgeniusAuthFile = path.join(homeDir, '.appgenius', 'auth.json');
  const claudeAuthFile = path.join(homeDir, 'Library', 'Application Support', 'appgenius', 'claude-auth.json');
  
  // .appgenius/auth.jsonの確認
  const appgeniusAuthData = readAuthFile(appgeniusAuthFile);
  
  if (appgeniusAuthData) {
    console.log(colors.green('AppGenius専用認証ファイルが存在します'));
    console.log(`ファイルパス: ${appgeniusAuthFile}`);
    console.log(`APIキー: ${maskKey(appgeniusAuthData.accessToken)}`);
    
    if (appgeniusAuthData.expiresAt) {
      const expires = new Date(appgeniusAuthData.expiresAt);
      const now = new Date();
      const isExpired = now > expires;
      
      console.log(`有効期限: ${expires.toLocaleString()}`);
      console.log(`ステータス: ${isExpired ? colors.red('期限切れ') : colors.green('有効')}`);
    }
    
    console.log('その他の情報:');
    Object.keys(appgeniusAuthData).forEach(key => {
      if (!['accessToken', 'expiresAt'].includes(key)) {
        console.log(`  ${key}: ${appgeniusAuthData[key]}`);
      }
    });
  } else {
    console.log(colors.yellow('AppGenius専用認証ファイルが見つかりません'));
  }
  
  // Claude認証ファイルの確認
  const claudeAuthData = readAuthFile(claudeAuthFile);
  
  if (claudeAuthData) {
    console.log(colors.green('\nClaude認証ファイルが存在します'));
    console.log(`ファイルパス: ${claudeAuthFile}`);
    console.log(`APIキー: ${maskKey(claudeAuthData.accessToken)}`);
    
    if (claudeAuthData.expiresAt) {
      const expires = new Date(claudeAuthData.expiresAt);
      const now = new Date();
      const isExpired = now > expires;
      
      console.log(`有効期限: ${expires.toLocaleString()}`);
      console.log(`ステータス: ${isExpired ? colors.red('期限切れ') : colors.green('有効')}`);
    }
  } else {
    console.log(colors.yellow('\nClaude認証ファイルが見つかりません'));
  }
}

/**
 * 環境変数を確認
 */
function checkEnvironmentVariables() {
  console.log(colors.cyan('\n環境変数を確認中...'));
  
  const relevantVars = [
    'ANTHROPIC_API_KEY',
    'CLAUDE_API_KEY',
    'CLAUDE_AUTH_FILE',
    'ANTHROPIC_ADMIN_KEY',
    'ANTHROPIC_API_BASE',
    'AUTH_FILE'
  ];
  
  let found = false;
  
  relevantVars.forEach(varName => {
    if (process.env[varName]) {
      found = true;
      if (varName.toLowerCase().includes('key') || varName.toLowerCase().includes('token')) {
        console.log(`${varName}: ${maskKey(process.env[varName])}`);
      } else {
        console.log(`${varName}: ${process.env[varName]}`);
      }
    }
  });
  
  if (!found) {
    console.log(colors.yellow('関連する環境変数は設定されていません'));
  }
}

/**
 * メイン関数
 */
function main() {
  console.log(colors.cyan('=== AppGenius環境変数/Claude設定確認ツール ==='));
  
  // AppGenius認証ファイルの確認
  checkAppGeniusAuthFiles();
  
  // 環境変数の確認
  checkEnvironmentVariables();
  
  // .clauderc ファイルの確認
  checkClaudeRc();
  
  // Claude CLIの確認
  checkClaudeCli();
  
  // 少し待ってから終了（Claude CLI確認の非同期処理を待つため）
  setTimeout(() => {
    console.log(colors.cyan('\n=== 確認完了 ==='));
  }, 2000);
}

// スクリプトを実行
main();