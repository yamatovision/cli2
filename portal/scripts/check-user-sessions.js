/**
 * ユーザーのセッション状態を確認するデバッグスクリプト
 */

const mongoose = require('mongoose');
const SimpleUser = require('../backend/models/simpleUser.model');

// MongoDB接続設定
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

async function checkUserSessions() {
  try {
    // MongoDBに接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB に接続しました\n');

    // 特定のユーザーを検索
    const user = await SimpleUser.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
    
    if (!user) {
      console.log('ユーザーが見つかりません');
      return;
    }

    console.log('ユーザー情報:');
    console.log('- 名前:', user.name);
    console.log('- メール:', user.email);
    console.log('- ステータス:', user.status);
    console.log('\nセッション情報:');
    console.log('- 旧形式セッション (activeSession):', user.activeSession ? JSON.stringify(user.activeSession, null, 2) : 'なし');
    console.log('- 新形式セッション (activeSessions):');
    
    if (user.activeSessions && user.activeSessions.length > 0) {
      user.activeSessions.forEach((session, index) => {
        console.log(`  [${index + 1}] クライアント: ${session.clientType}`);
        console.log(`      セッションID: ${session.sessionId}`);
        console.log(`      ログイン時刻: ${session.loginTime}`);
        console.log(`      最終アクティビティ: ${session.lastActivity}`);
        console.log(`      IPアドレス: ${session.ipAddress || 'なし'}`);
      });
    } else {
      console.log('  セッションなし');
    }

    // 接続を閉じる
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

// スクリプトを実行
checkUserSessions();