/**
 * トラップアクセスログモデル
 * ハニーポットへのアクセスを記録
 */
const honeypotConnection = require('../config/honeypot-db.config');
const { Schema } = require('mongoose');

/**
 * トラップアクセスログスキーマ
 */
const TrapAccessLogSchema = new Schema({
  // 使用されたトラップキー
  trapKey: {
    type: String,
    required: true,
    index: true
  },
  
  // アクセスされたプロンプトID
  promptId: {
    type: String,
    index: true
  },
  
  // ユーザー情報（特定できた場合）
  userId: {
    type: String,  // 本物のユーザーのObjectId
    index: true
  },
  
  userEmail: {
    type: String
  },
  
  // アクセス情報
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String
  },
  
  // リクエスト詳細
  endpoint: {
    type: String,
    required: true
  },
  
  method: {
    type: String,
    required: true
  },
  
  headers: {
    type: Object
  },
  
  // 生成された追跡ID
  trackingId: {
    type: String
  },
  
  // レスポンス情報
  responseStatus: {
    type: Number
  },
  
  responseType: {
    type: String,
    enum: ['trap_prompt', 'error', 'blocked'],
    default: 'trap_prompt'
  },
  
  // 地理情報（将来的な拡張用）
  geoLocation: {
    country: String,
    region: String,
    city: String
  },
  
  // フラグ
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  notes: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'trap_access_logs'
});

// インデックス
TrapAccessLogSchema.index({ createdAt: -1 });
TrapAccessLogSchema.index({ userId: 1, createdAt: -1 });
TrapAccessLogSchema.index({ trapKey: 1, createdAt: -1 });

/**
 * 静的メソッド：アクセスログを記録
 */
TrapAccessLogSchema.statics.logAccess = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('トラップアクセスログ記録エラー:', error);
    // エラーが発生してもメイン処理は継続
    return null;
  }
};

/**
 * 静的メソッド：ユーザーの最近のアクセスを取得
 */
TrapAccessLogSchema.statics.getRecentAccessByUser = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * 静的メソッド：トラップキーの使用統計を取得
 */
TrapAccessLogSchema.statics.getTrapKeyStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$trapKey',
        count: { $sum: 1 },
        lastUsed: { $max: '$createdAt' },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueIPs: { $addToSet: '$ipAddress' }
      }
    },
    {
      $project: {
        trapKey: '$_id',
        count: 1,
        lastUsed: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueIPCount: { $size: '$uniqueIPs' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// HONEYPOT_DB接続を使用してモデルを作成
const TrapAccessLog = honeypotConnection.model('TrapAccessLog', TrapAccessLogSchema);

module.exports = TrapAccessLog;