/**
 * 古いセッション形式をクリアするマイグレーションスクリプト
 * 
 * このスクリプトは、新しいクライアントタイプ別セッション管理に移行するため、
 * 既存の単一セッション（activeSession）をクリアします。
 */

const mongoose = require('mongoose');
const SimpleUser = require('../backend/models/simpleUser.model');

// MongoDB接続設定
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

async function clearOldSessions() {
  try {
    // MongoDBに接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB に接続しました');

    // すべてのユーザーの古いセッション形式をクリア
    const result = await SimpleUser.updateMany(
      {}, 
      { 
        $unset: { activeSession: "" },
        $set: { activeSessions: [] }
      }
    );

    console.log(`${result.modifiedCount} 件のユーザーの古いセッションをクリアしました`);

    // 特定のユーザー（shiraishi.tatsuya@mikoto.co.jp）の情報を確認
    const user = await SimpleUser.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
    if (user) {
      console.log('\n対象ユーザーの現在の状態:');
      console.log('- ユーザー名:', user.name);
      console.log('- メール:', user.email);
      console.log('- 古いセッション:', user.activeSession ? '存在' : 'なし');
      console.log('- 新しいセッション数:', user.activeSessions ? user.activeSessions.length : 0);
    }

    // 接続を閉じる
    await mongoose.connection.close();
    console.log('\nマイグレーション完了');
    
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

// スクリプトを実行
clearOldSessions();