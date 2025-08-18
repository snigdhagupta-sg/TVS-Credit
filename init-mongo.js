// MongoDB initialization script
db = db.getSiblingDB('funnel_analysis');

// Create collections
db.createCollection('users');
db.createCollection('page_visits');
db.createCollection('user_interactions');
db.createCollection('user_sessions');
db.createCollection('funnel_analytics');
db.createCollection('sentiment_analysis');

// Create indexes for better performance
db.users.createIndex({ "user_id": 1 }, { unique: true });
db.users.createIndex({ "date": 1, "device": 1 });

db.page_visits.createIndex({ "user_id": 1, "timestamp": -1 });
db.page_visits.createIndex({ "page": 1 });

db.user_interactions.createIndex({ "user_id": 1, "timestamp": -1 });
db.user_interactions.createIndex({ "page": 1, "interaction_type": 1 });

db.user_sessions.createIndex({ "session_id": 1 }, { unique: true });
db.user_sessions.createIndex({ "user_id": 1, "start_time": -1 });

db.funnel_analytics.createIndex({ "date": -1, "device_type": 1 });
db.funnel_analytics.createIndex({ "funnel_step": 1 });

db.sentiment_analysis.createIndex({ "user_id": 1, "timestamp": -1 });
db.sentiment_analysis.createIndex({ "page": 1 });

print("MongoDB initialization completed successfully!");