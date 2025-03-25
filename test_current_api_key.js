/**
 * AppGeniusで実際に使用されているAPIキーを確認するスクリプト
 */
require('dotenv').config();
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
  if (typeof key !== 'string') return 'invalid-type';
  
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
 * ローカルストレージファイルを読み込む（もし存在すれば）
 * macOSのローカルストレージの場所を確認
 */
function checkLocalStorage() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  console.log(colors.cyan('LocalStorageファイルを確認中...'));
  
  // AppGeniusのローカルストレージの予想される場所
  const possiblePaths = [
    path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'appgenius.appgenius'),
    path.join(homeDir, 'Library', 'Application Support', 'appgenius'),
    path.join(homeDir, '.appgenius'),
    path.join(homeDir, '.config', 'appgenius')
  ];
  
  let found = false;
  
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      console.log(colors.green(`ディレクトリが見つかりました: ${dirPath}`));
      
      // ディレクトリ内のファイルを一覧表示
      const files = fs.readdirSync(dirPath);
      console.log('ファイル一覧:');
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${stats.isDirectory() ? 'ディレクトリ' : 'ファイル'})`);
        
        // 認証関連と思われるファイルの内容を確認
        if (!stats.isDirectory() && (file.includes('auth') || file.includes('key') || file.includes('token'))) {
          found = true;
          const data = readAuthFile(filePath);
          if (data) {
            console.log(colors.magenta(`\n${file} の内容:`));
            
            // 認証データの重要な部分を表示
            if (data.accessToken) {
              console.log(`accessToken: ${maskKey(data.accessToken)}`);
            }
            if (data.refreshToken) {
              console.log(`refreshToken: ${maskKey(data.refreshToken)}`);
            }
            if (data.expiresAt) {
              const expires = new Date(data.expiresAt);
              console.log(`expiresAt: ${expires.toLocaleString()} (${data.expiresAt})`);
            }
            
            // その他の重要なプロパティも表示
            console.log('その他のプロパティ:');
            Object.keys(data).forEach(key => {
              if (!['accessToken', 'refreshToken', 'expiresAt'].includes(key)) {
                console.log(`  ${key}: ${data[key]}`);
              }
            });
          }
        }
      });
    }
  }
  
  if (!found) {
    console.log(colors.yellow('認証関連ファイルは見つかりませんでした。'));
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
    'CLAUDE_AUTH_FILE'
  ];
  
  let found = false;
  
  relevantVars.forEach(varName => {
    if (process.env[varName]) {
      found = true;
      console.log(`${varName}: ${maskKey(process.env[varName])}`);
    }
  });
  
  if (!found) {
    console.log(colors.yellow('関連する環境変数は設定されていません。'));
  }
}

/**
 * メイン関数
 */
function main() {
  console.log(colors.cyan('=== AppGenius認証情報確認ツール ===\n'));
  
  // ファイルの確認
  const appgeniusAuthFile = path.join(process.env.HOME || process.env.USERPROFILE, '.appgenius', 'auth.json');
  const claudeAuthFile = path.join(process.env.HOME || process.env.USERPROFILE, 'Library', 'Application Support', 'appgenius', 'claude-auth.json');
  
  // .appgenius/auth.jsonの確認
  console.log(colors.cyan('AppGenius専用認証ファイルを確認中...'));
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
  console.log(colors.cyan('\nClaude認証ファイルを確認中...'));
  const claudeAuthData = readAuthFile(claudeAuthFile);
  
  if (claudeAuthData) {
    console.log(colors.green('Claude認証ファイルが存在します'));
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
    console.log(colors.yellow('Claude認証ファイルが見つかりません'));
  }
  
  // 環境変数の確認
  checkEnvironmentVariables();
  
  // その他のローカルストレージを確認
  checkLocalStorage();
  
  console.log(colors.cyan('\n=== 確認完了 ==='));
}

// スクリプトを実行
main();