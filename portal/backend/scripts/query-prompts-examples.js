/**
 * Script to query real prompts from MongoDB database
 * This will help us understand the actual structure and content of prompts
 */

const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');
const Prompt = require('../models/prompt.model');

async function queryPrompts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbConfig.url, dbConfig.options);
    console.log('Connected to MongoDB');

    // Query 1: Get most popular prompts (by usage count)
    console.log('\n=== Most Popular Prompts ===');
    const popularPrompts = await Prompt.find({ isPublic: true })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('title description tags usageCount createdAt');
    
    popularPrompts.forEach((prompt, index) => {
      console.log(`\n${index + 1}. ${prompt.title}`);
      console.log(`   Description: ${prompt.description || 'No description'}`);
      console.log(`   Tags: ${prompt.tags.join(', ') || 'No tags'}`);
      console.log(`   Usage Count: ${prompt.usageCount}`);
      console.log(`   Created: ${prompt.createdAt.toISOString()}`);
    });

    // Query 2: Get recent prompts
    console.log('\n\n=== Recent Prompts ===');
    const recentPrompts = await Prompt.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description tags usageCount createdAt');
    
    recentPrompts.forEach((prompt, index) => {
      console.log(`\n${index + 1}. ${prompt.title}`);
      console.log(`   Description: ${prompt.description || 'No description'}`);
      console.log(`   Tags: ${prompt.tags.join(', ') || 'No tags'}`);
      console.log(`   Usage Count: ${prompt.usageCount}`);
      console.log(`   Created: ${prompt.createdAt.toISOString()}`);
    });

    // Query 3: Get tag distribution
    console.log('\n\n=== Tag Distribution ===');
    const tagAggregation = await Prompt.aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    console.log('Most common tags:');
    tagAggregation.forEach((tag) => {
      console.log(`   ${tag._id}: ${tag.count} prompts`);
    });

    // Query 4: Get some full prompt examples
    console.log('\n\n=== Full Prompt Examples ===');
    const fullPrompts = await Prompt.find({ isPublic: true })
      .sort({ usageCount: -1 })
      .limit(3)
      .select('title description content tags usageCount');
    
    fullPrompts.forEach((prompt, index) => {
      console.log(`\n${index + 1}. ${prompt.title}`);
      console.log(`   Description: ${prompt.description || 'No description'}`);
      console.log(`   Tags: ${prompt.tags.join(', ') || 'No tags'}`);
      console.log(`   Usage Count: ${prompt.usageCount}`);
      console.log(`   Content Preview (first 200 chars): ${prompt.content.substring(0, 200)}...`);
    });

    // Query 5: Get usage statistics
    console.log('\n\n=== Usage Statistics ===');
    const stats = await Prompt.aggregate([
      { $match: { isPublic: true } },
      {
        $group: {
          _id: null,
          totalPrompts: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgUsage: { $avg: '$usageCount' },
          maxUsage: { $max: '$usageCount' },
          minUsage: { $min: '$usageCount' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      console.log(`Total Public Prompts: ${stats[0].totalPrompts}`);
      console.log(`Total Usage Count: ${stats[0].totalUsage}`);
      console.log(`Average Usage: ${stats[0].avgUsage.toFixed(2)}`);
      console.log(`Max Usage: ${stats[0].maxUsage}`);
      console.log(`Min Usage: ${stats[0].minUsage}`);
    }

  } catch (error) {
    console.error('Error querying prompts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the query
queryPrompts();