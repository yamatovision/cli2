/**
 * 公開トークンの確認スクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./backend/config/db.config');

async function checkPublicTokens() {
  console.log('=== 公開トークン確認開始 ===');
  
  try {
    // 一時的にSKIP_DB_CONNECTIONを無効化
    const originalSkip = process.env.SKIP_DB_CONNECTION;
    process.env.SKIP_DB_CONNECTION = 'false';
    
    await dbConfig.connect(mongoose);
    
    const promptsCollection = mongoose.connection.db.collection('prompts');
    
    // 全プロンプトの公開トークン状況を確認
    const prompts = await promptsCollection.find({}).toArray();
    console.log(`総プロンプト数: ${prompts.length}`);
    
    // 公開トークンがあるプロンプトを確認
    const promptsWithToken = prompts.filter(p => p.publicToken);
    console.log(`公開トークンありプロンプト数: ${promptsWithToken.length}`);
    
    if (promptsWithToken.length > 0) {
      console.log('\n公開トークンありプロンプト:');
      promptsWithToken.forEach((prompt, index) => {
        console.log(`${index + 1}. ID: ${prompt._id}`);
        console.log(`   Title: ${prompt.title || 'タイトルなし'}`);
        console.log(`   PublicToken: ${prompt.publicToken}`);
        console.log(`   IsPublic: ${prompt.isPublic}`);
        console.log('');
      });
    }
    
    // BlueLampプロンプトを検索
    const blueLampPrompts = prompts.filter(p => 
      p.title && (
        p.title.includes('BlueLamp') || 
        p.title.includes('bluelamp') ||
        p.title.includes('★')
      )
    );
    
    console.log(`BlueLamp関連プロンプト数: ${blueLampPrompts.length}`);
    
    if (blueLampPrompts.length > 0) {
      console.log('\nBlueLamp関連プロンプト:');
      blueLampPrompts.forEach((prompt, index) => {
        console.log(`${index + 1}. ID: ${prompt._id}`);
        console.log(`   Title: ${prompt.title}`);
        console.log(`   PublicToken: ${prompt.publicToken || '未設定'}`);
        console.log(`   IsPublic: ${prompt.isPublic}`);
        console.log('');
      });
    }
    
    // 環境変数を元に戻す
    process.env.SKIP_DB_CONNECTION = originalSkip;
    
    await dbConfig.disconnect(mongoose);
    console.log('=== 公開トークン確認完了 ===');
    
  } catch (error) {
    console.error('公開トークン確認エラー:', error);
  }
}

checkPublicTokens().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('スクリプト実行エラー:', error);
  process.exit(1);
});