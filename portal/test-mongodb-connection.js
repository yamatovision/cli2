/**
 * MongoDB接続テストスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./backend/config/db.config');

async function testConnection() {
  console.log('=== MongoDB接続テスト開始 ===');
  
  // 環境変数確認
  console.log('環境変数確認:');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '設定済み' : '未設定');
  console.log('- SKIP_DB_CONNECTION:', process.env.SKIP_DB_CONNECTION);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  // 接続URL確認
  console.log('\n接続URL:', dbConfig.url);
  
  try {
    // 一時的にSKIP_DB_CONNECTIONを無効化
    const originalSkip = process.env.SKIP_DB_CONNECTION;
    process.env.SKIP_DB_CONNECTION = 'false';
    
    console.log('\nMongoDB接続試行中...');
    await dbConfig.connect(mongoose);
    
    // 接続状態確認
    console.log('接続状態:', mongoose.connection.readyState);
    console.log('データベース名:', mongoose.connection.name);
    
    // プロンプトコレクション確認
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n利用可能なコレクション:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // プロンプトデータ確認
    const promptsCollection = mongoose.connection.db.collection('prompts');
    const promptCount = await promptsCollection.countDocuments();
    console.log(`\nプロンプト数: ${promptCount}`);
    
    if (promptCount > 0) {
      const samplePrompts = await promptsCollection.find({}).limit(3).toArray();
      console.log('\nサンプルプロンプト:');
      samplePrompts.forEach((prompt, index) => {
        console.log(`${index + 1}. ID: ${prompt._id}, Title: ${prompt.title || 'タイトルなし'}`);
      });
    }
    
    // 環境変数を元に戻す
    process.env.SKIP_DB_CONNECTION = originalSkip;
    
    await dbConfig.disconnect(mongoose);
    console.log('\n=== MongoDB接続テスト完了 ===');
    
  } catch (error) {
    console.error('\nMongoDB接続エラー:', error);
    console.log('\n=== MongoDB接続テスト失敗 ===');
  }
}

testConnection().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});