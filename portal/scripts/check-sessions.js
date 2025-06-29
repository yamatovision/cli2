const mongoose = require('mongoose');
const SimpleUser = require('../backend/models/simpleUser.model');

// MongoDB接続設定
const MONGODB_URI = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

async function checkSessions() {
  try {
    // MongoDBに接続
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB接続成功');
    
    // 全ユーザーのセッション情報を取得
    const users = await SimpleUser.find({}, 'name email activeSessions activeSession').lean();
    
    console.log('\n=== ユーザーセッション情報 ===\n');
    
    for (const user of users) {
      console.log(`ユーザー: ${user.name} (${user.email})`);
      
      // 新形式のセッション（activeSessions）
      if (user.activeSessions && user.activeSessions.length > 0) {
        console.log('  アクティブセッション（新形式）:');
        user.activeSessions.forEach(session => {
          console.log(`    - クライアント: ${session.clientType}`);
          console.log(`      セッションID: ${session.sessionId}`);
          console.log(`      ログイン時刻: ${session.loginTime}`);
          console.log(`      最終アクティビティ: ${session.lastActivity}`);
          console.log(`      IPアドレス: ${session.ipAddress || 'なし'}`);
          
          // セッションの経過時間を計算
          const now = new Date();
          const lastActivity = new Date(session.lastActivity);
          const elapsedMinutes = Math.floor((now - lastActivity) / 1000 / 60);
          console.log(`      経過時間: ${elapsedMinutes}分`);
        });
      }
      
      // 旧形式のセッション（activeSession）
      if (user.activeSession && user.activeSession.sessionId) {
        console.log('  アクティブセッション（旧形式）:');
        console.log(`    セッションID: ${user.activeSession.sessionId}`);
        console.log(`    ログイン時刻: ${user.activeSession.loginTime}`);
        console.log(`    最終アクティビティ: ${user.activeSession.lastActivity}`);
        console.log(`    IPアドレス: ${user.activeSession.ipAddress || 'なし'}`);
      }
      
      if ((!user.activeSessions || user.activeSessions.length === 0) && 
          (!user.activeSession || !user.activeSession.sessionId)) {
        console.log('  アクティブセッションなし');
      }
      
      console.log('---');
    }
    
    // セッション統計
    const activeSessionCount = users.reduce((count, user) => {
      return count + (user.activeSessions ? user.activeSessions.length : 0);
    }, 0);
    
    console.log('\n=== セッション統計 ===');
    console.log(`総ユーザー数: ${users.length}`);
    console.log(`アクティブセッション数: ${activeSessionCount}`);
    
    // クライアントタイプ別の統計
    const clientTypeCounts = {};
    users.forEach(user => {
      if (user.activeSessions) {
        user.activeSessions.forEach(session => {
          clientTypeCounts[session.clientType] = (clientTypeCounts[session.clientType] || 0) + 1;
        });
      }
    });
    
    console.log('\nクライアントタイプ別:');
    Object.entries(clientTypeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB接続終了');
  }
}

// スクリプト実行
checkSessions();