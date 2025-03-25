/**
 * ダッシュボードのリクエストテスト
 * このスクリプトを実行してAPIリクエストのステータスを確認します
 */

const axios = require('axios');

// ベースURL
const BASE_URL = 'http://localhost:3000'; // フロントエンド
const API_URL = 'http://localhost:5000'; // バックエンド

// テスト用の認証リクエスト
async function testAuthStatus() {
  try {
    // ローカルストレージから認証トークンを取得（ブラウザでこのスクリプトを実行する必要があります）
    const simpleUser = localStorage.getItem('simpleUser');
    console.log('認証情報:', simpleUser ? '存在します' : '存在しません');
    
    if (!simpleUser) {
      return;
    }
    
    const userData = JSON.parse(simpleUser);
    const token = userData.accessToken;
    
    if (!token) {
      console.log('アクセストークンが見つかりません');
      return;
    }
    
    // 認証ヘッダーの設定
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // 認証チェックAPIをテスト
    const authResponse = await axios.get(`${API_URL}/api/simple/auth/check`, config);
    console.log('認証チェックAPI応答:', authResponse.status, authResponse.data);
    
    // 組織一覧APIをテスト
    const orgsResponse = await axios.get(`${API_URL}/api/simple/organizations`, config);
    console.log('組織一覧API応答:', orgsResponse.status, orgsResponse.data);
    
  } catch (error) {
    console.error('APIリクエストエラー:', error.message);
    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('データ:', error.response.data);
    }
  }
}

// クライアント側でブラウザの開発者コンソールにコピーして実行するためのコード
function clientTest() {
  // アクティブなネットワークリクエストをモニター
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    console.log('Fetch リクエスト:', args[0]);
    try {
      const response = await originalFetch(...args);
      console.log('Fetch レスポンス:', response.status, response.ok);
      return response;
    } catch (error) {
      console.error('Fetch エラー:', error);
      throw error;
    }
  };
  
  // 認証状態の詳細チェック
  function checkAuthStatus() {
    try {
      const simpleUser = localStorage.getItem('simpleUser');
      if (!simpleUser) {
        console.log('認証情報が見つかりません');
        return;
      }
      
      const userData = JSON.parse(simpleUser);
      console.log('認証ユーザー情報:', {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hasAccessToken: !!userData.accessToken,
        hasRefreshToken: !!userData.refreshToken,
      });
      
      if (userData.accessToken) {
        // トークンが有効かどうかをチェック
        const parts = userData.accessToken.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1]));
            console.log('トークンペイロード:', payload);
            
            if (payload.exp) {
              const expTime = new Date(payload.exp * 1000);
              const now = new Date();
              console.log('トークン有効期限:', expTime.toLocaleString());
              console.log('現在時刻:', now.toLocaleString());
              console.log('有効期限切れ:', expTime < now ? 'はい' : 'いいえ');
            }
          } catch (e) {
            console.error('トークン解析エラー:', e);
          }
        } else {
          console.log('トークンの形式が不正です');
        }
      }
    } catch (e) {
      console.error('認証状態チェックエラー:', e);
    }
  }
  
  // ダッシュボードコンテンツのDOMチェック
  function checkDashboardDOM() {
    console.log('==== ダッシュボードDOM検査 ====');
    
    // タブコンポーネントの確認
    const tabsElement = document.querySelector('.MuiTabs-root');
    console.log('タブ要素:', tabsElement ? '存在します' : '見つかりません');
    
    if (tabsElement) {
      const tabs = tabsElement.querySelectorAll('[role="tab"]');
      console.log('タブ数:', tabs.length);
      tabs.forEach((tab, index) => {
        console.log(`タブ ${index + 1}:`, tab.textContent, '選択状態:', tab.getAttribute('aria-selected'));
      });
    }
    
    // タブパネルの確認
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    console.log('タブパネル数:', tabPanels.length);
    tabPanels.forEach((panel, index) => {
      console.log(`タブパネル ${index + 1}: 表示状態=`, panel.getAttribute('hidden') ? '非表示' : '表示');
    });
    
    // 組織カードの確認
    const orgTable = document.querySelector('table[aria-label="組織一覧"]');
    console.log('組織一覧テーブル:', orgTable ? '存在します' : '見つかりません');
    
    if (orgTable) {
      const rows = orgTable.querySelectorAll('tbody tr');
      console.log('組織行数:', rows.length);
    }
    
    // ローディングインジケーターの確認
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    console.log('ローディングスケルトン数:', skeletons.length);
    
    // エラーアラートの確認
    const alerts = document.querySelectorAll('.MuiAlert-root');
    console.log('アラート数:', alerts.length);
    if (alerts.length > 0) {
      alerts.forEach((alert, index) => {
        console.log(`アラート ${index + 1}:`, alert.textContent);
      });
    }
  }
  
  // DOM変更の監視
  function watchDOMChanges() {
    console.log('DOM変更の監視を開始します...');
    
    const targetNode = document.querySelector('#root');
    if (!targetNode) {
      console.log('ルート要素が見つかりません');
      return;
    }
    
    const config = { attributes: true, childList: true, subtree: true };
    
    const callback = function(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log('DOM変更検出:', new Date().toISOString());
          setTimeout(checkDashboardDOM, 100); // 少し遅延させて安定した状態を確認
          break;
        }
      }
    };
    
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
    console.log('DOM監視設定完了');
  }
  
  // 手動で再認証を実行
  async function triggerRefreshToken() {
    try {
      console.log('トークンリフレッシュを実行します...');
      
      // simpleUserからリフレッシュトークンを取得
      const simpleUser = JSON.parse(localStorage.getItem('simpleUser') || '{}');
      if (!simpleUser.refreshToken) {
        console.log('リフレッシュトークンがありません');
        return;
      }
      
      // リフレッシュAPIを呼び出し
      const response = await fetch('/api/simple/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: simpleUser.refreshToken })
      });
      
      const data = await response.json();
      console.log('リフレッシュレスポンス:', response.status, data);
      
      if (response.ok && data.success && data.data.accessToken) {
        // 新しいトークンを保存
        simpleUser.accessToken = data.data.accessToken;
        if (data.data.refreshToken) {
          simpleUser.refreshToken = data.data.refreshToken;
        }
        
        localStorage.setItem('simpleUser', JSON.stringify(simpleUser));
        console.log('認証情報を更新しました');
        
        // 再読み込み
        window.location.reload();
      } else {
        console.log('トークンリフレッシュに失敗しました');
      }
    } catch (error) {
      console.error('リフレッシュエラー:', error);
    }
  }
  
  // ヘルパー関数をグローバルに公開
  window.appgenius = {
    checkAuth: checkAuthStatus,
    checkDOM: checkDashboardDOM,
    watchDOM: watchDOMChanges,
    refreshToken: triggerRefreshToken
  };
  
  // 初期チェックを実行
  checkAuthStatus();
  checkDashboardDOM();
  watchDOMChanges();
  
  console.log('テスト関数がセットアップされました。以下のコマンドを使用できます:');
  console.log('appgenius.checkAuth() - 認証状態を確認');
  console.log('appgenius.checkDOM() - ダッシュボードDOMを確認');
  console.log('appgenius.watchDOM() - DOM変更の監視を開始');
  console.log('appgenius.refreshToken() - 手動でトークンリフレッシュを実行');
}

// ブラウザで使用するコード（コピー用）を出力
console.log('=== ブラウザコンソールにコピーして実行するコード ===');
console.log(clientTest.toString());
console.log('\n// 実行');
console.log('clientTest();');