/**
 * レート制限ミドルウェア
 * 短時間での過度な接続に対する制限を実装します
 */

// メモリ内キャッシュ (実運用ではRedisなどの外部ストレージが望ましい)
const ipRequestStore = new Map();
const userRequestStore = new Map();

// レート制限のデバッグ情報を記録するマップ
const rateDebugStore = new Map();

// リクエスト記録をクリアする関数（デバッグ用）
function clearRateLimitStore() {
  ipRequestStore.clear();
  userRequestStore.clear();
  rateDebugStore.clear();
  console.log('レート制限記録をクリアしました');
}

// 設定値 - 大幅に緩和
const IP_WINDOW_MS = 60 * 1000; // 1分間のウィンドウ
const IP_MAX_REQUESTS = 2000;    // IPアドレスあたり1分間に2000リクエスト（極端に緩和）
const AUTH_WINDOW_MS = 60 * 1000; // 1分間のウィンドウ
const AUTH_MAX_REQUESTS = 1000;   // 認証エンドポイントは1分間に1000回まで（極端に緩和）

/**
 * リクエスト回数を記録し、制限を超えているかチェック
 * @param {string} key キャッシュキー
 * @param {Map} store 記録用ストア
 * @param {number} windowMs 時間枠 (ミリ秒)
 * @param {number} maxRequests 最大リクエスト数
 * @returns {boolean} 制限を超えているかどうか
 */
function isRateLimited(key, store, windowMs, maxRequests, path) {
  const now = Date.now();
  const record = store.get(key) || { count: 0, resetAt: now + windowMs, paths: {} };
  
  // 期限切れなら初期化
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    record.paths = {};
    if (path) record.paths[path] = 1;
  } else {
    record.count += 1;
    // パス別のカウントも記録（デバッグ用）
    if (path) {
      record.paths[path] = (record.paths[path] || 0) + 1;
    }
  }
  
  store.set(key, record);
  
  // デバッグ情報を記録
  if (record.count > maxRequests) {
    // レート制限超過のログを取る
    const debugKey = `${key}:${path || 'unknown'}`;
    const debugInfo = rateDebugStore.get(debugKey) || { 
      count: 0, 
      lastExceeded: now,
      path: path || 'unknown',
      clientInfo: {}
    };
    
    debugInfo.count += 1;
    debugInfo.lastExceeded = now;
    rateDebugStore.set(debugKey, debugInfo);
    
    // 標準出力にも記録
    console.warn(`レート制限超過: ${key} (${path || 'unknown'}) - ${record.count}/${maxRequests} リクエスト`);
  }
  
  return record.count > maxRequests;
}

/**
 * IPアドレスベースの一般的なレート制限
 * @param {Object} req リクエストオブジェクト
 * @param {Object} res レスポンスオブジェクト
 * @param {Function} next 次のミドルウェア
 */
exports.generalRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (isRateLimited(ip, ipRequestStore, IP_WINDOW_MS, IP_MAX_REQUESTS, req.path)) {
    const record = ipRequestStore.get(ip);
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'リクエスト回数の制限を超えました。しばらく待ってから再試行してください。',
        resetIn: Math.ceil((record.resetAt - Date.now()) / 1000),
        pathRequests: record.paths[req.path] || 0,
        totalRequests: record.count,
        limit: IP_MAX_REQUESTS
      }
    });
  }
  
  next();
};

/**
 * 認証エンドポイント向けの厳格なレート制限
 * @param {Object} req リクエストオブジェクト
 * @param {Object} res レスポンスオブジェクト
 * @param {Function} next 次のミドルウェア
 */
exports.authRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // エンドポイント別の制限設定
  if (req.path === '/auth/check') {
    // /auth/check エンドポイント - 1分間に10000リクエストまで（さらに緩和）
    const pathMaxRequests = 10000;
    if (isRateLimited(ip, ipRequestStore, 60 * 1000, pathMaxRequests, req.path)) {
      // デバッグ情報も追加
      const record = ipRequestStore.get(ip);
      const clientInfo = {
        url: req.originalUrl || req.url,
        method: req.method,
        referer: req.headers.referer || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      };
      
      // デバッグストアに記録
      const debugKey = `${ip}:${req.path}`;
      if (rateDebugStore.has(debugKey)) {
        const debugInfo = rateDebugStore.get(debugKey);
        debugInfo.clientInfo = clientInfo;
        rateDebugStore.set(debugKey, debugInfo);
      }
      
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: '認証チェックのリクエスト回数の制限を超えました。しばらく待ってから再試行してください。',
          resetIn: Math.ceil((record.resetAt - Date.now()) / 1000),
          pathRequests: record.paths[req.path] || 0,
          totalRequests: record.count,
          limit: pathMaxRequests
        }
      });
    }
  } else if (req.path === '/auth/login') {
    // /auth/login エンドポイント - 1分間に1000リクエストまで（極端に緩和）
    const pathMaxRequests = 1000;
    if (isRateLimited(ip, ipRequestStore, 60 * 1000, pathMaxRequests, req.path)) {
      const record = ipRequestStore.get(ip);
      const resetTime = Math.ceil((record.resetAt - Date.now()) / 1000);
      // レスポンス時間を短く設定（最大5秒）
      const retryAfter = Math.min(resetTime, 5);
      
      // デバッグ情報も追加
      const clientInfo = {
        url: req.originalUrl || req.url,
        method: req.method,
        referer: req.headers.referer || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      };
      
      // デバッグストアに記録
      const debugKey = `${ip}:${req.path}`;
      if (rateDebugStore.has(debugKey)) {
        const debugInfo = rateDebugStore.get(debugKey);
        debugInfo.clientInfo = clientInfo;
        rateDebugStore.set(debugKey, debugInfo);
      }
      
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'ログイン試行回数の制限を超えました。しばらく待ってから再試行してください。',
          resetIn: resetTime,
          retryAfter: retryAfter, // 待機時間の最大値を15秒に短縮
          pathRequests: record.paths[req.path] || 0,
          totalRequests: record.count,
          limit: pathMaxRequests
        }
      });
    }
  } else {
    // 他の認証エンドポイントには標準制限を適用
    if (isRateLimited(ip, ipRequestStore, AUTH_WINDOW_MS, AUTH_MAX_REQUESTS, req.path)) {
      const record = ipRequestStore.get(ip);
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: '認証リクエスト回数の制限を超えました。しばらく待ってから再試行してください。',
          resetIn: Math.ceil((record.resetAt - Date.now()) / 1000),
          pathRequests: record.paths[req.path] || 0,
          totalRequests: record.count,
          limit: AUTH_MAX_REQUESTS
        }
      });
    }
  }
  
  next();
};

/**
 * ユーザーIDベースの認証後のレート制限
 * @param {Object} req リクエストオブジェクト
 * @param {Object} res レスポンスオブジェクト
 * @param {Function} next 次のミドルウェア
 */
exports.userRateLimit = (req, res, next) => {
  if (!req.userId) {
    return next();
  }
  
  const key = `user:${req.userId}`;
  
  if (isRateLimited(key, userRequestStore, IP_WINDOW_MS, IP_MAX_REQUESTS, req.path)) {
    const record = userRequestStore.get(key);
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'リクエスト回数の制限を超えました。しばらく待ってから再試行してください。',
        resetIn: Math.ceil((record.resetAt - Date.now()) / 1000),
        pathRequests: record.paths[req.path] || 0,
        totalRequests: record.count,
        limit: IP_MAX_REQUESTS
      }
    });
  }
  
  next();
};

/**
 * レート制限情報を取得するためのAPI
 * デバッグと診断のためのもの
 */
exports.getRateLimitInfo = () => {
  const ipStoreData = {};
  for (const [key, data] of ipRequestStore.entries()) {
    ipStoreData[key] = {
      count: data.count,
      resetAt: data.resetAt,
      paths: data.paths,
      remaining: Math.max(0, IP_MAX_REQUESTS - data.count),
      timeToReset: Math.max(0, Math.ceil((data.resetAt - Date.now()) / 1000))
    };
  }
  
  const userStoreData = {};
  for (const [key, data] of userRequestStore.entries()) {
    userStoreData[key] = {
      count: data.count,
      resetAt: data.resetAt,
      paths: data.paths,
      remaining: Math.max(0, IP_MAX_REQUESTS - data.count),
      timeToReset: Math.max(0, Math.ceil((data.resetAt - Date.now()) / 1000))
    };
  }
  
  const debugData = {};
  for (const [key, data] of rateDebugStore.entries()) {
    debugData[key] = data;
  }
  
  return {
    ipBasedLimits: ipStoreData,
    userBasedLimits: userStoreData,
    debugInfo: debugData,
    config: {
      IP_WINDOW_MS,
      IP_MAX_REQUESTS,
      AUTH_WINDOW_MS,
      AUTH_MAX_REQUESTS
    }
  };
};

// 設定エクスポート (テスト用)
exports.ipRequestStore = ipRequestStore;
exports.userRequestStore = userRequestStore;
exports.rateDebugStore = rateDebugStore;
exports.clearRateLimitStore = clearRateLimitStore;
exports.AUTH_WINDOW_MS = AUTH_WINDOW_MS;
exports.AUTH_MAX_REQUESTS = AUTH_MAX_REQUESTS;
exports.IP_WINDOW_MS = IP_WINDOW_MS;
exports.IP_MAX_REQUESTS = IP_MAX_REQUESTS;