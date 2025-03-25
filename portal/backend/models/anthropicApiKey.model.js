/**
 * AnthropicApiKey モデル
 * Anthropic API キーの情報を保存するモデル
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnthropicApiKeySchema = new Schema({
  // AnthropicのAPIキーID
  apiKeyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // APIキーの完全な値（プレーンテキストで保存）
  apiKeyFull: {
    type: String,
    required: true
  },
  
  // APIキーの名前
  name: {
    type: String,
    default: ''
  },
  
  // APIキーのステータス
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // ワークスペースID（該当する場合）
  workspaceId: {
    type: String,
    default: null
  },

  // 最終使用日時
  lastUsedAt: {
    type: Date,
    default: null
  },
  
  // 最終同期日時
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// インデックス
AnthropicApiKeySchema.index({ apiKeyId: 1 }, { unique: true });
AnthropicApiKeySchema.index({ status: 1 });
AnthropicApiKeySchema.index({ name: 1 });
// 完全なAPIキーにインデックスを追加
AnthropicApiKeySchema.index({ apiKeyFull: 1 });
// 複合インデックス（ステータスと名前の組み合わせ検索用）
AnthropicApiKeySchema.index({ status: 1, name: 1 });

// APIキーの一覧を取得するスタティック関数
AnthropicApiKeySchema.statics.findAllActive = function() {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// APIキーの検索（ID部分一致）
AnthropicApiKeySchema.statics.findByPartialId = function(partialId) {
  return this.find({ 
    apiKeyId: { $regex: partialId, $options: 'i' } 
  });
};

// APIキーの検索（APIキー部分一致）
AnthropicApiKeySchema.statics.findByPartialKey = function(partialKey) {
  return this.find({ 
    apiKeyFull: { $regex: partialKey, $options: 'i' } 
  });
};

// APIキーをインポートまたは更新
AnthropicApiKeySchema.statics.importKey = async function(apiKeyData) {
  // 既存のAPIキーを探す
  const existingKey = await this.findOne({ apiKeyId: apiKeyData.id });
  
  if (existingKey) {
    // 既存キーを更新
    if (apiKeyData.apiKeyFull) {
      existingKey.apiKeyFull = apiKeyData.apiKeyFull;
    }
    existingKey.name = apiKeyData.name;
    existingKey.lastSyncedAt = new Date();
    return await existingKey.save();
  } else {
    // 新規APIキーを作成
    return await this.create({
      apiKeyId: apiKeyData.id,
      apiKeyFull: apiKeyData.apiKeyFull,
      name: apiKeyData.name,
      status: 'active',
      lastSyncedAt: new Date()
    });
  }
};

const AnthropicApiKey = mongoose.model('AnthropicApiKey', AnthropicApiKeySchema);
module.exports = AnthropicApiKey;