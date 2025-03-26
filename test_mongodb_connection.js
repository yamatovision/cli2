// MongoDB接続テストスクリプト
const { MongoClient } = require('mongodb');

// 接続URI
const uri = "mongodb+srv://atlas-sample-dataset-load-67e3a5695c0c8c568c95566e:TPVusEQhZbpA63Wx@cluster0.cjam9ef.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// 接続テスト関数
async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    // データベースに接続
    await client.connect();
    console.log('MongoDB接続に成功しました！');
    
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
      process.exit(0);
    } else {
      console.log('接続テストは失敗しました。URIとパスワードを確認してください。');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('テスト実行中にエラーが発生しました:', err);
    process.exit(1);
  });