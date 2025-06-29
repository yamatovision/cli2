/**
 * シンプルなユーザーモデル
 * 認証システムのユーザー情報を管理する最小限のモデル
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const authConfig = require('../config/auth.config');

const SimpleUserSchema = new mongoose.Schema({
  // ===== 基本情報 =====
  
  // ユーザー名
  name: {
    type: String,
    required: [true, 'ユーザー名は必須です'],
    trim: true,
    maxlength: [100, 'ユーザー名は100文字以内である必要があります']
  },
  
  // メールアドレス
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      '有効なメールアドレスを入力してください'
    ]
  },
  
  // パスワード
  password: {
    type: String,
    required: [true, 'パスワードは必須です'],
    minlength: [8, 'パスワードは8文字以上である必要があります']
  },
  
  // ===== ユーザー権限 =====
  
  // ユーザー権限（SuperAdmin/Admin/User）
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'User'],
    default: 'User'
  },
  
  // ===== 組織・APIキー情報 =====
  
  // 所属組織ID
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleOrganization',
    default: null
  },
  
  // 紐づくAPIキーID
  apiKeyId: {
    type: String,
    ref: 'SimpleApiKey',
    default: null
  },
  
  // APIキー値（実際のAnthropicキー）
  apiKeyValue: {
    type: String,
    default: null
  },
  
  // ClaudeCode起動回数カウンター
  claudeCodeLaunchCount: {
    type: Number,
    default: 0
  },
  
  // ===== 認証情報 =====
  
  // リフレッシュトークン
  refreshToken: {
    type: String,
    default: null
  },
  
  // アクティブセッション情報（複数クライアント対応）
  activeSessions: [{
    clientType: {
      type: String,
      enum: ['vscode', 'portal', 'cli'],
      required: true
    },
    sessionId: {
      type: String,
      required: true
    },
    loginTime: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  }],
  
  // 旧バージョン互換性のための単一セッション（非推奨）
  activeSession: {
    sessionId: {
      type: String,
      default: null
    },
    loginTime: {
      type: Date,
      default: null
    },
    lastActivity: {
      type: Date,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  },
  
  // アカウントステータス
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  
  // ===== CLI認証情報 =====
  
  // CLI用APIキー配列
  cliApiKeys: [{
    key: {
      type: String,
      required: true,
      unique: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  
  // JSON出力から機密情報を除外
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    }
  }
});

// ===== インデックス =====
SimpleUserSchema.index({ email: 1 }, { unique: true });
SimpleUserSchema.index({ role: 1 });
SimpleUserSchema.index({ organizationId: 1 });
SimpleUserSchema.index({ status: 1 });

// ===== メソッド =====

// パスワードの保存前に自動ハッシュ化
SimpleUserSchema.pre('save', async function(next) {
  // パスワードが変更された場合のみハッシュ化
  if (!this.isModified('password')) return next();
  
  try {
    // bcryptを使用したパスワードハッシュ化
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// パスワード検証メソッド
SimpleUserSchema.methods.validatePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error("パスワード検証エラー:", error);
    throw error;
  }
};

// ユーザー権限チェックメソッド
SimpleUserSchema.methods.isSuperAdmin = function() {
  return this.role === 'SuperAdmin';
};

SimpleUserSchema.methods.isAdmin = function() {
  return this.role === 'Admin' || this.role === 'SuperAdmin';
};

// 認証用の静的メソッド
SimpleUserSchema.statics.findByEmail = function(email) {
  return this.findOne({ 
    email: email.toLowerCase(),
    status: 'active'
  });
};

SimpleUserSchema.statics.findByRefreshToken = function(token) {
  return this.findOne({ 
    refreshToken: token,
    status: 'active'
  });
};

// CLI APIキーでユーザーを検索
SimpleUserSchema.statics.findByCliApiKey = function(apiKey) {
  return this.findOne({
    'cliApiKeys.key': apiKey,
    'cliApiKeys.isActive': true,
    status: 'active'
  });
};

// リフレッシュトークン更新メソッド
SimpleUserSchema.methods.updateRefreshToken = function(token) {
  this.refreshToken = token;
  return this.save();
};

// 組織とAPIキー設定メソッド
SimpleUserSchema.methods.setOrganization = function(organizationId) {
  this.organizationId = organizationId;
  return this.save();
};

SimpleUserSchema.methods.setApiKey = function(apiKeyId) {
  this.apiKeyId = apiKeyId;
  return this.save();
};

// セッション管理メソッド（新バージョン：クライアントタイプ別）
SimpleUserSchema.methods.hasActiveSessionForClient = function(clientType) {
  // activeSessionsが存在しない場合は空配列として扱う
  if (!this.activeSessions || !Array.isArray(this.activeSessions)) {
    return false;
  }
  return this.activeSessions.some(session => session.clientType === clientType);
};

SimpleUserSchema.methods.getActiveSessionForClient = function(clientType) {
  // activeSessionsが存在しない場合は空配列として扱う
  if (!this.activeSessions || !Array.isArray(this.activeSessions)) {
    return null;
  }
  return this.activeSessions.find(session => session.clientType === clientType);
};

SimpleUserSchema.methods.setActiveSessionForClient = function(clientType, sessionId, ipAddress, userAgent) {
  // activeSessionsが存在しない場合は初期化
  if (!this.activeSessions || !Array.isArray(this.activeSessions)) {
    this.activeSessions = [];
  }
  
  // 既存の同じクライアントタイプのセッションを削除
  this.activeSessions = this.activeSessions.filter(session => session.clientType !== clientType);
  
  // 新しいセッションを追加
  this.activeSessions.push({
    clientType: clientType,
    sessionId: sessionId,
    loginTime: new Date(),
    lastActivity: new Date(),
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  });
  
  return this.save();
};

SimpleUserSchema.methods.clearActiveSessionForClient = function(clientType) {
  // activeSessionsが存在しない場合は初期化
  if (!this.activeSessions || !Array.isArray(this.activeSessions)) {
    this.activeSessions = [];
    return this.save();
  }
  
  this.activeSessions = this.activeSessions.filter(session => session.clientType !== clientType);
  return this.save();
};

SimpleUserSchema.methods.validateSessionForClient = function(clientType, sessionId) {
  const session = this.getActiveSessionForClient(clientType);
  return session && session.sessionId === sessionId;
};

SimpleUserSchema.methods.updateSessionActivityForClient = function(clientType) {
  // activeSessionsが存在しない場合は初期化
  if (!this.activeSessions || !Array.isArray(this.activeSessions)) {
    this.activeSessions = [];
  }
  
  const session = this.getActiveSessionForClient(clientType);
  if (session) {
    session.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// 旧バージョン互換性メソッド（非推奨）
SimpleUserSchema.methods.hasActiveSession = function() {
  return !!(this.activeSession && this.activeSession.sessionId);
};

SimpleUserSchema.methods.setActiveSession = function(sessionId, ipAddress, userAgent) {
  this.activeSession = {
    sessionId: sessionId,
    loginTime: new Date(),
    lastActivity: new Date(),
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  };
  return this.save();
};

SimpleUserSchema.methods.clearActiveSession = function() {
  this.activeSession = {
    sessionId: null,
    loginTime: null,
    lastActivity: null,
    ipAddress: null,
    userAgent: null
  };
  return this.save();
};

SimpleUserSchema.methods.updateSessionActivity = function() {
  if (this.activeSession && this.activeSession.sessionId) {
    this.activeSession.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// CLI APIキー管理メソッド
SimpleUserSchema.methods.generateCliApiKey = function() {
  const crypto = require('crypto');
  const key = 'CLI_' + crypto.randomBytes(32).toString('hex');
  
  // 既存のキーをすべて無効化
  this.cliApiKeys.forEach(apiKey => {
    apiKey.isActive = false;
  });
  
  // 新しいキーを追加
  this.cliApiKeys.push({
    key: key,
    createdAt: new Date(),
    isActive: true
  });
  
  return this.save().then(() => key);
};

SimpleUserSchema.methods.deactivateCliApiKey = function(key) {
  const apiKey = this.cliApiKeys.find(k => k.key === key);
  if (apiKey) {
    apiKey.isActive = false;
    return this.save();
  }
  return Promise.resolve(this);
};

SimpleUserSchema.methods.updateCliApiKeyUsage = function(key) {
  const apiKey = this.cliApiKeys.find(k => k.key === key && k.isActive);
  if (apiKey) {
    apiKey.lastUsedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);
module.exports = SimpleUser;