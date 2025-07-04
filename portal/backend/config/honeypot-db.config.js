/**
 * Honeypot データベース設定
 * トラップ用の偽プロンプトを管理する専用データベース
 */
require('dotenv').config();

const mongoose = require('mongoose');

// 同じMongoDBクラスター内の別データベースを使用
const HONEYPOT_DB_URI = process.env.HONEYPOT_DB_URI || 
  'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/HONEYPOT_DB?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

// 別の接続インスタンスを作成
const honeypotConnection = mongoose.createConnection(HONEYPOT_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  maxPoolSize: 5  // メインDBより少なめに設定
});

// 接続イベントハンドラー
honeypotConnection.on('connected', () => {
  console.log('✅ HONEYPOT_DB に接続しました');
});

honeypotConnection.on('error', (err) => {
  console.error('❌ HONEYPOT_DB 接続エラー:', err);
});

honeypotConnection.on('disconnected', () => {
  console.log('🔌 HONEYPOT_DB から切断されました');
});

module.exports = honeypotConnection;