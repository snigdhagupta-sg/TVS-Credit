# API Documentation

## Overview
FastAPI-based REST API providing comprehensive analytics endpoints for e-commerce funnel analysis. The API handles user behavior tracking, sentiment analysis, machine learning predictions, and real-time metrics.

## Base URL
- Development: `http://localhost:8000`
- Health Check: `GET /health`
- Interactive Docs: `http://localhost:8000/docs`

## Authentication
Currently no authentication required for development. All endpoints are publicly accessible.

## Response Format
All endpoints return JSON responses with consistent error handling:
- Success: HTTP 200 with data
- Client Error: HTTP 4xx with error message
- Server Error: HTTP 500 with error details

## Core Endpoints

### Dashboard Metrics
**GET /dashboard/metrics**
- Returns KPI overview including total users, conversion rates, and revenue
- Query params: `start_date`, `end_date` (ISO format)
- Response: Aggregate metrics with time-based filtering

**GET /dashboard/trends**
- Historical trend data for metrics visualization
- Supports daily, weekly, monthly aggregation
- Returns time series data for charting

### Funnel Analysis
**GET /analytics/funnel**
- Complete funnel analysis with conversion rates between steps
- Includes drop-off points and user journey progression
- Query params: `device_type` for segmentation

**GET /analytics/funnel/dropoffs**
- Detailed drop-off analysis with reasons and patterns
- Identifies bottlenecks in user journey
- Returns actionable insights for optimization

### User Analytics
**GET /users/behavior**
- Individual user behavior patterns and interactions
- Query params: `user_id`, `session_id`, `page_type`
- Returns detailed interaction history

**GET /users/similar/{user_id}**
- Find users with similar behavior patterns using ML embeddings
- Returns ranked list of similar users with similarity scores
- Powered by Two Tower model

**GET /users/journey/{user_id}**
- Complete user journey visualization data
- Shows path through funnel with timestamps and interactions
- Includes conversion status and session details

### Sentiment Analysis
**GET /sentiment/analysis**
- Aggregate sentiment analysis across all pages
- Query params: `page_type`, `date_range`
- Returns sentiment distribution and trends

**GET /sentiment/page/{page_type}**
- Page-specific sentiment analysis
- Detailed sentiment breakdown with user feedback categorization
- Supports home, search, payment, confirmation pages

### Real-time Data
**GET /realtime/metrics**
- Live metrics for real-time dashboard updates
- Includes active users, current conversion rate, live transactions
- Cached with Redis for performance

**WebSocket /ws/realtime**
- WebSocket connection for live data streaming
- Pushes real-time updates to connected clients
- Handles user behavior events and metric changes

### Machine Learning
**POST /models/retrain**
- Trigger retraining of Two Tower recommendation model
- Processes latest user behavior data
- Returns training status and model metrics

**GET /models/status**
- Current status of ML models including last training time
- Model performance metrics and health checks
- Version information for deployed models

**GET /recommendations/{user_id}**
- ML-powered recommendations for user
- Uses trained Two Tower model for personalization
- Returns ranked recommendations with confidence scores

### Analytics Engine
**GET /analytics/conversion-rates**
- Detailed conversion rate analysis across funnel steps
- Supports device-based segmentation
- Returns historical trends and comparisons

**GET /analytics/user-segments**
- User segmentation analysis based on behavior patterns
- Includes demographic and behavioral clustering
- Returns segment characteristics and conversion metrics

**POST /analytics/refresh**
- Manually refresh analytics cache
- Triggers recomputation of metrics
- Returns cache refresh status

## Error Handling
- **400 Bad Request**: Invalid parameters or malformed request
- **404 Not Found**: Requested resource doesn't exist
- **422 Unprocessable Entity**: Validation errors on request data
- **500 Internal Server Error**: Server-side processing errors

Common error response format:
```json
{
  "detail": "Error description",
  "error_code": "SPECIFIC_ERROR_CODE"
}
```

## Rate Limiting
No rate limiting implemented in current version. Consider implementing for production use.

## Data Formats
- Dates: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- User IDs: Integer or string format
- Device types: `desktop`, `mobile`, `tablet`
- Page types: `home`, `search`, `payment`, `confirmation`

## Performance Notes
- Most endpoints implement Redis caching for improved response times
- Large datasets use pagination (implement if needed)
- WebSocket connections handle real-time data efficiently
- Database queries optimized with proper indexing

## Development Notes
- API documentation auto-generated with FastAPI's built-in docs
- Pydantic models ensure type safety and validation
- Async endpoints support high concurrency
- Comprehensive error logging for debugging