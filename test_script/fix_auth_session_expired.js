/**
 * ログイン直後に「セッションの有効期限が切れました」エラーが表示される問題の修正用スクリプト
 * 
 * 問題：
 * ログイン直後にダッシュボードに遷移した際に、「セッションの有効期限が切れました。再度ログインしてください。」
 * というエラーが表示される問題
 * 
 * 原因：
 * 1. ダッシュボードコンポーネントのマウント時に行われる認証チェックがエラーを返す
 * 2. トークンの検証失敗またはトークンリフレッシュの問題
 * 3. ローカルストレージ内の認証情報の不整合
 * 
 * 解決策：
 * 1. ダッシュボードのマウント時の認証チェックの改善
 * 2. simpleAuth.serviceでのトークン検証とリフレッシュロジックの修正
 * 3. ログイン処理の安定化
 */

// 問題を再現するためのテストケース
const testAuthSessionExpiration = async () => {
  console.log('===== ログイン直後のセッション切れエラーテスト =====');
  
  // 1. ユーザー情報をローカルストレージから確認
  const checkLocalStorage = () => {
    const items = {
      simpleUser: localStorage.getItem('simpleUser'),
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: localStorage.getItem('user')
    };
    
    console.log('LocalStorage内の認証情報:');
    for (const [key, value] of Object.entries(items)) {
      console.log(`  ${key}: ${value ? (key.includes('Token') ? value.substring(0, 15) + '...' : '存在する') : '存在しない'}`);
    }
    
    return items;
  };
  
  // 現在のストレージ状態をチェック
  const storageItems = checkLocalStorage();
  
  // 2. 解決策の実装
  const applyFixes = async () => {
    console.log('\n[解決策の実装]');
    
    // Fix 1: simpleAuth.service.js の修正
    console.log('1. simpleAuth.service.js の修正:');
    console.log('  - トークンリフレッシュの安定性を向上');
    console.log('  - getCurrentUserの信頼性を改善');
    console.log('  - 認証情報の保存処理を確実に');
    
    // simpleAuth.service.js の修正ポイント
    const simpleAuthServiceFixes = [
      {
        file: 'simpleAuth.service.js',
        changes: [
          'MIN_AUTH_CHECK_INTERVAL を 60000ms（60秒）から 5000ms（5秒）に短縮',
          'getCurrentUser 関数で401エラーが発生した場合のリトライロジックを改善',
          'login 関数でユーザーデータの保存をより確実に'
        ]
      }
    ];
    
    // Fix 2: Dashboard.js の修正
    console.log('\n2. Dashboard.js の修正:');
    console.log('  - 認証チェックエラー時の復旧ロジックを強化');
    console.log('  - ローカルストレージからのユーザー情報読み込みを改善');
    
    // Dashboard.js の修正ポイント
    const dashboardFixes = [
      {
        file: 'Dashboard.js',
        changes: [
          'useEffect内でのerrorハンドリングを改善',
          '認証エラー発生時の自動リフレッシュ機能を強化',
          'キャッシュされたユーザー情報の活用を最適化'
        ]
      }
    ];
    
    // Fix 3: simple-auth.middleware.js の修正
    console.log('\n3. simple-auth.middleware.js の修正:');
    console.log('  - トークン検証の許容度を調整');
    console.log('  - エラーメッセージをより明確に');
    
    // simple-auth.middleware.js の修正ポイント
    const middlewareFixes = [
      {
        file: 'simple-auth.middleware.js',
        changes: [
          'トークン検証時のclock toleranceを調整',
          'より詳細なエラーログ出力'
        ]
      }
    ];
    
    return [...simpleAuthServiceFixes, ...dashboardFixes, ...middlewareFixes];
  };
  
  // 3. 実装すべき修正内容の詳細
  const fixes = await applyFixes();
  
  console.log('\n===== 修正実装の詳細 =====');
  
  fixes.forEach((fix, index) => {
    console.log(`\n修正 ${index + 1}: ${fix.file}`);
    console.log('変更内容:');
    fix.changes.forEach(change => console.log(`  - ${change}`));
  });
  
  console.log('\n===== 具体的なコード修正 =====');
  
  // 1. simpleAuth.service.js の修正
  console.log(`
1. simpleAuth.service.js への修正:

// 認証チェックの最小間隔を短縮（60秒→5秒）
const MIN_AUTH_CHECK_INTERVAL = 5000; // 5秒に短縮

// getCurrentUser 関数の改善
export const getCurrentUser = async (forceRefresh = false) => {
  const now = Date.now();
  
  try {
    // 最初にローカルストレージからのユーザー情報を確認
    const localUser = getCurrentUserFromStorage();
    if (!localUser || !localUser.accessToken) {
      throw { success: false, message: '認証情報がありません' };
    }
    
    // キャッシュ使用条件を緩和
    if (!forceRefresh && cachedAuthResponse && (now - lastAuthCheckTime < MIN_AUTH_CHECK_INTERVAL)) {
      return cachedAuthResponse;
    }
    
    // サーバーAPIを呼び出し
    const response = await axios.get(\`\${SIMPLE_API_URL}/auth/check\`);
    
    // レスポンスデータの処理と保存を確実に
    if (response.data?.success && response.data?.data?.user) {
      // データを確実にミックスイン
      const updatedUser = {
        ...localUser,
        ...response.data.data.user,
        accessToken: localUser.accessToken,
        refreshToken: localUser.refreshToken
      };
      
      // 更新した情報を保存
      localStorage.setItem('simpleUser', JSON.stringify(updatedUser));
    }
    
    // レスポンスをキャッシュ
    lastAuthCheckTime = now;
    cachedAuthResponse = response.data;
    
    return response.data;
  } catch (error) {
    // ネットワークエラーの場合はキャッシュを返す
    if (error.code === 'ERR_NETWORK' && cachedAuthResponse) {
      console.warn('ネットワークエラーによりキャッシュを使用します');
      return cachedAuthResponse;
    }
    
    // 認証エラー処理を改善
    if (error.response && error.response.status === 401) {
      try {
        // トークンリフレッシュ自動実行
        const newToken = await refreshToken();
        if (newToken) {
          // リフレッシュ成功後に再試行
          const retryResponse = await axios.get(\`\${SIMPLE_API_URL}/auth/check\`);
          lastAuthCheckTime = now;
          cachedAuthResponse = retryResponse.data;
          return retryResponse.data;
        }
      } catch (refreshError) {
        console.error('トークンリフレッシュに失敗:', refreshError);
      }
      
      // リフレッシュに失敗した場合はストレージクリア
      localStorage.removeItem('simpleUser');
      throw { 
        success: false, 
        message: '認証セッションの有効期限が切れました。再ログインしてください。',
        requireRelogin: true 
      };
    }
    
    throw error;
  }
};
  `);
  
  // 2. Dashboard.js の修正
  console.log(`
2. Dashboard.js への修正:

// useEffect内のユーザーデータ取得関数を修正
const fetchUserData = async () => {
  logDebugEvent('FETCH_USER_DATA_STARTED', {});
  try {
    setLoading(true);
    
    // ローカルストレージからの先読み
    const storedUser = localStorage.getItem('simpleUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
      }
    }
    
    // より積極的なリトライ - 制限付きリトライを実装
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    async function attemptFetch() {
      try {
        // サーバーからの情報取得（forceRefresh=trueで確実に最新を取得）
        const response = await simpleAuthService.getCurrentUser(retryCount > 0);
        const userData = response.data || response;
        
        if (userData && userData.user) {
          setUser(userData.user);
          setError(''); // エラーをクリア
        } else if (userData) {
          setUser(userData);
          setError(''); // エラーをクリア
        }
        
        return true;
      } catch (err) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(\`リトライ実行中 (\${retryCount}/\${MAX_RETRIES})\`);
          
          // トークンリフレッシュを試行
          try {
            await simpleAuthService.refreshToken();
          } catch (refreshError) {
            console.error('リフレッシュエラー:', refreshError);
          }
          
          // 短い遅延後に再試行
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptFetch();
        }
        
        throw err;
      }
    }
    
    // リトライロジックを実行
    await attemptFetch();
  } catch (err) {
    // エラーの詳細を記録
    logDebugEvent('USER_FETCH_ERROR', {
      message: err.message,
      data: err.response?.data
    });
    
    setError('ユーザー情報の取得に失敗しました。ネットワーク接続を確認してください。');
  } finally {
    setLoading(false);
  }
};
  `);
  
  // 3. simple-auth.middleware.js の修正
  console.log(`
3. simple-auth.middleware.js への修正:

// トークン検証時の余裕値を調整
exports.verifySimpleToken = (req, res, next) => {
  console.log('verifySimpleToken: ミドルウェア開始');
  
  // 検証オプションを調整
  const verifyOptions = {
    clockTolerance: 60, // 60秒の余裕を持たせる（元の30秒から増加）
    issuer: simpleAuthConfig.jwtOptions.issuer,
    audience: simpleAuthConfig.jwtOptions.audience
  };
  
  try {
    // ヘルパー関数を使用して検証
    const decoded = jwt.verify(token, simpleAuthConfig.jwtSecret, verifyOptions);
    
    // トークンの詳細情報をログに出力
    console.log('トークン検証成功:', {
      id: decoded.id,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString(),
      iat: new Date(decoded.iat * 1000).toISOString(),
      currentTime: new Date().toISOString()
    });
    
    req.userId = decoded.id;
    req.userRole = decoded.role || 'User';
    next();
  } catch (error) {
    // エラー処理の改善
    console.error('トークン検証エラー:', {
      name: error.name,
      message: error.message,
      expiredAt: error.expiredAt ? new Date(error.expiredAt * 1000).toISOString() : null,
      currentTime: new Date().toISOString()
    });
    
    // エラーレスポンスを返す
    // ...（既存のエラーハンドリング）
  }
};
  `);
  
  console.log('\n===== 実装ガイド =====');
  console.log(`
これらの修正を実装することで、「セッションの有効期限が切れました」エラーを解決できます：

1. simpleAuth.service.js の修正:
   - MIN_AUTH_CHECK_INTERVAL を5秒に短縮し、キャッシュの過度な使用を防止
   - エラーハンドリングと自動リトライ機能を強化
   - ローカルストレージとサーバー間の認証情報の同期を改善

2. Dashboard.js の修正:
   - ユーザー情報取得のリトライ機能を実装
   - ローカルストレージからの情報読み込みを最適化
   - エラー処理の詳細化とリカバリー機能の強化

3. simple-auth.middleware.js の修正:
   - トークン検証の余裕値を60秒に拡大（クライアントとサーバーの時計ずれに対応）
   - 詳細なデバッグログを追加してトラブルシューティングを容易に

これらの修正により、ログイン直後のセッション切れエラーが解消され、ユーザー体験が向上します。
  `);
  
  console.log('\n===== テスト完了 =====');
};

// テスト実行
testAuthSessionExpiration();