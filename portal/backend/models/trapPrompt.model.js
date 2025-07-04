/**
 * トラッププロンプトモデル
 * ハニーポット用の偽プロンプトを管理
 */
const honeypotConnection = require('../config/honeypot-db.config');
const { Schema } = require('mongoose');

/**
 * トラッププロンプトスキーマ
 */
const TrapPromptSchema = new Schema({
  // 元となる本物のプロンプトID
  originalPromptId: {
    type: String,  // 本物のプロンプトのObjectId
    required: true,
    unique: true,
    index: true
  },
  
  // プロンプトの基本情報（本物と同じ構造）
  title: {
    type: String,
    required: true
  },
  
  description: {
    type: String
  },
  
  // デコイコンテンツ（追跡IDテンプレート付き）
  content: {
    type: String,
    required: true
  },
  
  // オリジナルのデコイファイル名
  decoyFileName: {
    type: String,
    required: true
  },
  
  tags: [{
    type: String
  }],
  
  // トラップの種類
  trapType: {
    type: String,
    enum: ['honeypot', 'decoy', 'advanced'],
    default: 'honeypot'
  },
  
  // アクティブフラグ
  isActive: {
    type: Boolean,
    default: true
  },
  
  // アクセス統計
  accessCount: {
    type: Number,
    default: 0
  },
  
  lastAccessedAt: {
    type: Date
  },
  
  // 追跡ID生成のためのテンプレート
  trackingTemplate: {
    type: String,
    default: '{{trapType}}-{{promptId}}-{{timestamp}}-{{random}}'
  },
  
  // メタデータ（本物と同じ形式）
  metadata: {
    usageCount: {
      type: Number,
      default: 0
    },
    createdAt: Date,
    updatedAt: Date
  }
}, {
  timestamps: true,
  collection: 'trap_prompts'
});

// インデックス
TrapPromptSchema.index({ title: 1 });
TrapPromptSchema.index({ tags: 1 });
TrapPromptSchema.index({ isActive: 1 });
TrapPromptSchema.index({ accessCount: -1 });

/**
 * アクセスカウントを増やす
 */
TrapPromptSchema.methods.incrementAccess = async function() {
  this.accessCount += 1;
  this.lastAccessedAt = new Date();
  return this.save();
};

/**
 * 追跡IDを生成
 */
TrapPromptSchema.methods.generateTrackingId = function() {
  const crypto = require('crypto');
  const template = this.trackingTemplate;
  
  return template
    .replace('{{trapType}}', this.trapType)
    .replace('{{promptId}}', this.originalPromptId)
    .replace('{{timestamp}}', Date.now())
    .replace('{{random}}', crypto.randomBytes(4).toString('hex'));
};

/**
 * 追跡IDを埋め込んだコンテンツを生成
 */
TrapPromptSchema.methods.getContentWithTracking = function(additionalInfo = {}) {
  const trackingId = this.generateTrackingId();
  const zeroWidthSpace = '\u200B';  // ゼロ幅スペース
  
  // 複数箇所に見えない形で埋め込む
  let trackedContent = this.content;
  
  // 「として」の後に埋め込み
  trackedContent = trackedContent.replace(
    /として/g, 
    `として${zeroWidthSpace}${trackingId}${zeroWidthSpace}`
  );
  
  // 「ます。」の前に埋め込み
  trackedContent = trackedContent.replace(
    /ます。/g,
    `ます${zeroWidthSpace}${trackingId}${zeroWidthSpace}。`
  );
  
  return trackedContent;
};

// HONEYPOT_DB接続を使用してモデルを作成
const TrapPrompt = honeypotConnection.model('TrapPrompt', TrapPromptSchema);

module.exports = TrapPrompt;