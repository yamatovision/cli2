// MongoDB接続テスト（新しい認証情報）
const { MongoClient } = require('mongodb');

// 接続URI（新しいユーザー情報）
const username = "shiraishitatsuya";
const password = "TPVusEQhZbpA63Wx";
const cluster = "cluster0.cjam9ef.mongodb.net";
const uri = `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority`;

console.log('接続文字列:', uri);

// 接続テスト関数
async function testConnection() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000 // 5秒でタイムアウト
  });
  
  try {
    // データベースに接続
    await client.connect();
    console.log('MongoDB接続に成功しました！');
    
    // 簡単なピング操作でサーバーに接続できることを確認
    await client.db("admin").command({ ping: 1 });
    console.log("サーバーへのPingに成功しました！");
    
    // データベース一覧を取得
    const adminDb = client.db("admin");
    const result = await adminDb.admin().listDatabases();
    
    console.log('利用可能なデータベース:');
    result.databases.forEach(db => {
      console.log(` - ${db.name}`);
    });
    
    return true;
  } catch (err) {
    console.error('MongoDB接続に失敗しました:', err);
    return false;
  } finally {
    // クライアントを閉じる
    await client.close();
    console.log('MongoDB接続を閉じました');
  }
}

// テスト実行
testConnection()
  .then(success => {
    if (success) {
      console.log('接続テストは成功しました。この接続URIとパスワードは有効です。');
    } else {
      console.log('接続テストは失敗しました。URIとパスワードを確認してください。');
    }
  });