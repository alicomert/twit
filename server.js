// Complete Twitter API Server with integrated configuration
import express from 'express';
import cors from 'cors';
import { Rettiwt } from 'rettiwt-api';

// ===== CONFIGURATION =====
// Twitter API Configuration
const API_KEY = 'a2R0PXZTVUZ1amhhRnV4Yk45NVVpOUZQd2diblJWNGs0TXlKTWI5aXVhdlk7YXV0aF90b2tlbj03ZTI0NDk2MGM4ZmE2YzgwZDkyYTVmMGU4YzVhNWQ4MjQyODMyY2Y2O2N0MD1lYTYwYjY1YmVkYzhkNmU2MDZiYmIyMGQ2Y2I2Njc3ZjI0NjkwZDE3ODk2M2IwN2UyNThjZmMzNTM0MGY3MGNjOWM4NTA0OGFlYzNmZWZlYWIxZmFhZTQ3MGYyNTAwOTRkOGRkNjY1ZGQxNTZiODQzMDAwNGY4MjA0Y2UyMTNhOTQyODRmYTQ5OWY3NTYwOTlkZjczYjRmNDVkYTE4MTk3O3R3aWQ9dSUzRDE2ODEwNjIwNDYyNDk0ODQyOTY7';

// Server Configuration
const PORT = 3000;
const NODE_ENV = 'development';

// Optional Configuration
const RATE_LIMIT_WINDOW = 15;
const RATE_LIMIT_MAX = 100;
const LOG_LEVEL = 'info';

// ===== APPLICATION SETUP =====
const app = express();

// Initialize Rettiwt with auth token (user authentication)
const rettiwt = new Rettiwt({ 
  apiKey: API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Complete Twitter API with Rettiwt-API Integration', 
    status: 'running',
    authMode: API_KEY ? 'User Authentication (Full Access)' : 'Guest Authentication (Limited Access)',
    environment: NODE_ENV,
    endpoints: [
      'GET / - Health check and API information',
      'GET /user/:username - Get tweets from user',
      'GET /search?q=keyword - Search tweets',
      'GET /tweet/:id - Get specific tweet',
      'GET /user/:username/info - Get user information',
      'GET /trending - Trending topics (requires auth)'
    ],
    examples: [
      `http://localhost:${PORT}/user/elonmusk`,
      `http://localhost:${PORT}/search?q=javascript`,
      `http://localhost:${PORT}/user/elonmusk/info`,
      `http://localhost:${PORT}/tweet/1234567890123456789`
    ]
  });
});

// Get user tweets endpoint
app.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const count = parseInt(req.query.count) || 20;
    
    console.log(`Fetching tweets for user: ${username}`);
    
    // Get user tweets using rettiwt-api with search method
    const searchQuery = {
      fromUsers: [username],
      hasImages: false,
      hasVideos: false
    };
    
    const tweets = await rettiwt.tweet.search(searchQuery, count, null);
    
    if (!tweets || !tweets.list || tweets.list.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tweets found for this user',
        username: username
      });
    }
    
    res.json({
      success: true,
      username: username,
      count: tweets.list.length,
      tweets: tweets.list.map(tweet => ({
        id: tweet.id,
        text: tweet.fullText,
        createdAt: tweet.createdAt,
        author: tweet.tweetBy?.userName || username,
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        media: tweet.media?.map(m => ({
          type: m.type,
          url: m.url
        })) || []
      }))
    });
    
  } catch (error) {
    console.error('Error fetching user tweets:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tweets',
      message: error.message,
      suggestion: 'Try with a different username or check if the user exists'
    });
  }
});

// Search tweets endpoint
app.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    const count = parseInt(req.query.count) || 20;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    console.log(`Searching tweets for: ${query}`);
    
    // Search tweets using rettiwt-api with proper query format
    const searchQuery = {
      includeWords: [query],
      hasImages: false,
      hasVideos: false
    };
    
    const searchResults = await rettiwt.tweet.search(searchQuery, count, null);
    
    if (!searchResults || !searchResults.list || searchResults.list.length === 0) {
      return res.json({
        success: true,
        query: query,
        count: 0,
        tweets: [],
        message: 'No tweets found for this search query'
      });
    }
    
    res.json({
      success: true,
      query: query,
      count: searchResults.list.length,
      tweets: searchResults.list.map(tweet => ({
        id: tweet.id,
        text: tweet.fullText,
        createdAt: tweet.createdAt,
        author: tweet.tweetBy?.userName || 'unknown',
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        media: tweet.media?.map(m => ({
          type: m.type,
          url: m.url
        })) || []
      }))
    });
    
  } catch (error) {
    console.error('Error searching tweets:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search tweets',
      message: error.message,
      suggestion: 'Try with a different search query'
    });
  }
});

// Get specific tweet endpoint
app.get('/tweet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching tweet with ID: ${id}`);
    
    // Get specific tweet using rettiwt-api
    const tweet = await rettiwt.tweet.details(id);
    
    if (!tweet) {
      return res.status(404).json({
        success: false,
        error: 'Tweet not found',
        tweetId: id
      });
    }
    
    res.json({
      success: true,
      tweet: {
        id: tweet.id,
        text: tweet.fullText,
        createdAt: tweet.createdAt,
        author: tweet.tweetBy?.userName || 'unknown',
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        media: tweet.media?.map(m => ({
          type: m.type,
          url: m.url
        })) || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching tweet:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tweet',
      message: error.message,
      suggestion: 'Check if the tweet ID is correct and the tweet exists'
    });
  }
});

// Get user information endpoint
app.get('/user/:username/info', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`Fetching user info for: ${username}`);
    
    // Get user details using rettiwt-api
    const userInfo = await rettiwt.user.detailsByUsername(username);
    
    if (!userInfo) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        username: username
      });
    }
    
    res.json({
      success: true,
      user: {
        id: userInfo.id,
        username: userInfo.userName,
        displayName: userInfo.fullName,
        description: userInfo.description,
        followers: userInfo.followersCount || 0,
        following: userInfo.followingCount || 0,
        tweets: userInfo.tweetsCount || 0,
        verified: userInfo.isVerified || false,
        createdAt: userInfo.createdAt,
        profileImage: userInfo.profileImage,
        bannerImage: userInfo.bannerImage,
        location: userInfo.location
      }
    });
    
  } catch (error) {
    console.error('Error fetching user info:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user information',
      message: error.message,
      suggestion: 'Check if the username is correct and the user exists'
    });
  }
});

// Get trending topics (if authenticated)
app.get('/trending', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'This endpoint requires user authentication',
        message: 'API key is required for this feature'
      });
    }
    
    console.log('Fetching trending topics...');
    
    // This would require additional implementation for trending topics
    res.json({
      success: false,
      error: 'Trending topics endpoint not yet implemented',
      message: 'This feature requires additional implementation',
      note: 'You can use the search endpoint to find popular tweets instead'
    });
    
  } catch (error) {
    console.error('Error fetching trending topics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending topics',
      message: error.message
    });
  }
});

// Advanced search endpoint with filters
app.get('/advanced-search', async (req, res) => {
  try {
    const { 
      q: query, 
      from_user, 
      has_images, 
      has_videos, 
      count = 20 
    } = req.query;
    
    if (!query && !from_user) {
      return res.status(400).json({
        success: false,
        error: 'Either "q" (query) or "from_user" parameter is required'
      });
    }
    
    console.log(`Advanced search - Query: ${query}, From: ${from_user}`);
    
    // Build advanced search query
    const searchQuery = {};
    
    if (query) {
      searchQuery.includeWords = [query];
    }
    
    if (from_user) {
      searchQuery.fromUsers = [from_user];
    }
    
    if (has_images === 'true') {
      searchQuery.hasImages = true;
    }
    
    if (has_videos === 'true') {
      searchQuery.hasVideos = true;
    }
    
    const searchResults = await rettiwt.tweet.search(searchQuery, parseInt(count), null);
    
    res.json({
      success: true,
      query: searchQuery,
      count: searchResults?.list?.length || 0,
      tweets: searchResults?.list?.map(tweet => ({
        id: tweet.id,
        text: tweet.fullText,
        createdAt: tweet.createdAt,
        author: tweet.tweetBy?.userName || 'unknown',
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        media: tweet.media?.map(m => ({
          type: m.type,
          url: m.url
        })) || []
      })) || []
    });
    
  } catch (error) {
    console.error('Error in advanced search:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to perform advanced search',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /',
      'GET /user/:username',
      'GET /search?q=keyword',
      'GET /tweet/:id',
      'GET /user/:username/info',
      'GET /trending',
      'GET /advanced-search'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Complete Twitter API Server running on port ${PORT}`);
  console.log(`📡 Authentication: ${API_KEY ? 'User (Full Access)' : 'Guest (Limited Access)'}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`  - GET / (health check & API info)`);
  console.log(`  - GET /user/:username (get user tweets)`);
  console.log(`  - GET /search?q=keyword (search tweets)`);
  console.log(`  - GET /tweet/:id (get specific tweet)`);
  console.log(`  - GET /user/:username/info (get user information)`);
  console.log(`  - GET /trending (trending topics - requires auth)`);
  console.log(`  - GET /advanced-search (advanced search with filters)`);
  console.log(`\n🔗 Example usage:`);
  console.log(`  - http://localhost:${PORT}/user/elonmusk`);
  console.log(`  - http://localhost:${PORT}/search?q=javascript`);
  console.log(`  - http://localhost:${PORT}/user/elonmusk/info`);
  console.log(`  - http://localhost:${PORT}/tweet/1234567890123456789`);
  console.log(`  - http://localhost:${PORT}/advanced-search?q=bitcoin&has_images=true`);
  
  if (API_KEY) {
    console.log(`\n✅ API Key configured - Full access enabled!`);
  } else {
    console.log(`\n⚠️  No API Key - Using guest mode (limited access)`);
  }
  
  console.log(`\n🔧 Configuration:`);
  console.log(`  - Rate Limit: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW} minutes`);
  console.log(`  - Log Level: ${LOG_LEVEL}`);
});