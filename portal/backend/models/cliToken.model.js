/**
 * CLIトークンモデル
 * CLI認証用のトークン管理を行う専用モデル
 * P-005: CLIトークンモデル完成
 */
const mongoose = require('mongoose');

const CliTokenSchema = new mongoose.Schema({
  // ===== 基本情報 =====
  
  // ユーザーID（参照）
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser',
    required: [true, 'ユーザーIDは必須です'],
    index: true
  },
  
  // CLIトークン値（保存しない - セキュリティのため）
  token: {
    type: String,
    required: false,  // 保存時は不要
    unique: false,    // ハッシュで一意性を保証
    index: false      // インデックス不要
  },
  
  // トークンハッシュ（セキュリティ強化）
  tokenHash: {
    type: String,
    required: true,
    unique: true,  // ハッシュの一意性を保証
    index: true
  },
  
  // ===== 有効期限管理 =====
  
  // 作成日時
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // 有効期限
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // 最終使用日時（P-005要件）
  lastUsed: {
    type: Date,
    default: null,
    index: true
  },
  
  // ===== デバイス情報（P-005要件） =====
  
  // デバイス情報
  deviceInfo: {
    // デバイス名
    deviceName: {
      type: String,
      default: null
    },
    
    // OS情報
    platform: {
      type: String,
      default: null
    },
    
    // アーキテクチャ
    arch: {
      type: String,
      default: null
    },
    
    // ホスト名
    hostname: {
      type: String,
      default: null
    },
    
    // IPアドレス
    ipAddress: {
      type: String,
      default: null
    },
    
    // ユーザーエージェント
    userAgent: {
      type: String,
      default: null
    }
  },
  
  // ===== ステータス管理 =====
  
  // アクティブ状態
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // 無効化理由
  deactivationReason: {
    type: String,
    enum: ['expired', 'revoked', 'replaced', 'security', null],
    default: null
  },
  
  // 無効化日時
  deactivatedAt: {
    type: Date,
    default: null
  },
  
  // ===== 使用統計 =====
  
  // 使用回数
  usageCount: {
    type: Number,
    default: 0
  },
  
  // 最終アクセスIP
  lastAccessIp: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  
  // JSON出力から機密情報を除外
  toJSON: {
    transform: function(doc, ret) {
      delete ret.token;
      delete ret.tokenHash;
      return ret;
    }
  }
});

// ===== インデックス設定 =====
CliTokenSchema.index({ userId: 1, isActive: 1 });
CliTokenSchema.index({ tokenHash: 1 }, { unique: true });  // ハッシュに一意性インデックス
CliTokenSchema.index({ expiresAt: 1 });
CliTokenSchema.index({ createdAt: 1 });
CliTokenSchema.index({ lastUsed: 1 });
CliTokenSchema.index({ isActive: 1, expiresAt: 1 });

// ===== 静的メソッド =====

// トークンでCLIトークンを検索（ハッシュ化して検索）
CliTokenSchema.statics.findByToken = function(token) {
  const crypto = require('crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    tokenHash: tokenHash,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
};

// トークンハッシュでCLIトークンを検索
CliTokenSchema.statics.findByTokenHash = function(tokenHash) {
  return this.findOne({
    tokenHash: tokenHash,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
};

// ユーザーのアクティブなトークンを取得
CliTokenSchema.statics.findActiveTokensByUser = function(userId) {
  return this.find({
    userId: userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// 期限切れトークンを検索
CliTokenSchema.statics.findExpiredTokens = function() {
  return this.find({
    $or: [
      { expiresAt: { $lte: new Date() } },
      { isActive: false }
    ]
  });
};

// ===== インスタンスメソッド =====

// トークンの有効性チェック
CliTokenSchema.methods.isValid = function() {
  return this.isActive && this.expiresAt > new Date();
};

// トークンの使用記録
CliTokenSchema.methods.recordUsage = function(ipAddress = null) {
  this.lastUsed = new Date();
  this.usageCount += 1;
  if (ipAddress) {
    this.lastAccessIp = ipAddress;
  }
  return this.save();
};

// トークンの無効化
CliTokenSchema.methods.deactivate = function(reason = 'revoked') {
  this.isActive = false;
  this.deactivationReason = reason;
  this.deactivatedAt = new Date();
  return this.save();
};

// デバイス情報の更新
CliTokenSchema.methods.updateDeviceInfo = function(deviceInfo) {
  if (deviceInfo) {
    this.deviceInfo = {
      ...this.deviceInfo,
      ...deviceInfo
    };
  }
  return this.save();
};

// 有効期限の延長
CliTokenSchema.methods.extendExpiration = function(days = 7) {
  const newExpirationDate = new Date();
  newExpirationDate.setDate(newExpirationDate.getDate() + days);
  this.expiresAt = newExpirationDate;
  return this.save();
};

// ===== ミドルウェア =====

// 保存前の処理
CliTokenSchema.pre('save', async function(next) {
  try {
    // 新規作成時にトークンハッシュを生成
    if (this.isNew && this.token) {
      const crypto = require('crypto');
      this.tokenHash = crypto.createHash('sha256').update(this.token).digest('hex');
      
      // ハッシュ生成後にトークンを削除（セキュリティのため）
      // 注意: toJSONで既に除外されているが、念のため保存しない
      this.token = undefined;
    }
    
    // 有効期限が設定されていない場合はデフォルト（7日）を設定
    if (this.isNew && !this.expiresAt) {
      const defaultExpiration = new Date();
      defaultExpiration.setDate(defaultExpiration.getDate() + 7);
      this.expiresAt = defaultExpiration;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ===== 仮想フィールド =====

// 残り有効時間（秒）
CliTokenSchema.virtual('remainingTime').get(function() {
  if (!this.isValid()) return 0;
  return Math.max(0, Math.floor((this.expiresAt - new Date()) / 1000));
});

// 残り有効時間（人間が読める形式）
CliTokenSchema.virtual('remainingTimeHuman').get(function() {
  const seconds = this.remainingTime;
  if (seconds <= 0) return '期限切れ';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}日${hours}時間`;
  if (hours > 0) return `${hours}時間${minutes}分`;
  return `${minutes}分`;
});

const CliToken = mongoose.model('CliToken', CliTokenSchema);
module.exports = CliToken;