# Backend Documentation

## Overview
FastAPI-based backend providing comprehensive e-commerce funnel analysis with async request handling, vector database integration, and machine learning capabilities. Built for high performance with MongoDB, Redis caching, and Milvus vector search.

## Architecture

### Core Components
- **FastAPI Application** (`app.py`) - Main API server with all endpoints
- **Analytics Engine** (`analytics_engine.py`) - Core business logic for funnel analysis
- **Database Layer** (`database.py`) - Async MongoDB and Milvus connections
- **Data Models** (`models.py`) - Pydantic schemas for request/response validation
- **Data Ingestion** (`data_ingestion.py`) - CSV processing with synthetic data generation

### Technology Stack
- **Framework**: FastAPI with async/await support
- **Database**: MongoDB for document storage
- **Vector DB**: Milvus for similarity search and embeddings
- **Cache**: Redis for performance optimization
- **Validation**: Pydantic v2 for data models
- **ML Integration**: TensorFlow/Keras for deep learning models

## Application Structure

### FastAPI Application (`app.py`)
Main application server handling all HTTP endpoints and WebSocket connections.

**Key Features:**
- CORS middleware for frontend integration
- Async request handling for high concurrency
- Comprehensive error handling with detailed responses
- Health check endpoint for monitoring
- WebSocket support for real-time updates

**Endpoint Categories:**
- Dashboard metrics and KPI calculations
- Funnel analysis with device segmentation
- User behavior tracking and analytics
- Sentiment analysis across funnel pages
- Machine learning model management
- Real-time data streaming via WebSocket

### Analytics Engine (`analytics_engine.py`)
Core business logic module handling all analytics computations.

**Capabilities:**
- Funnel step conversion rate calculations
- Drop-off point identification and analysis
- User journey pattern recognition
- Time-based trend analysis
- Device-based segmentation
- Real-time metrics computation

**Performance Features:**
- Async database queries for scalability
- MongoDB aggregation pipeline optimization
- Redis caching for frequently requested data
- Batch processing for large datasets

### Database Management (`database.py`)
Handles all database connections and operations.

**Database Integrations:**
- **MongoDB**: User data, sessions, page visits, interactions
- **Milvus**: Vector embeddings for user similarity search
- **Redis**: Caching layer for performance optimization

**Connection Features:**
- Async connection pooling
- Automatic reconnection handling
- Environment-based configuration
- Health check monitoring

### Data Models (`models.py`)
Pydantic v2 schemas ensuring type safety and data validation.

**Model Categories:**
- **Request Models**: API endpoint input validation
- **Response Models**: Structured API responses
- **Database Models**: MongoDB document schemas
- **Analytics Models**: Computed metrics and aggregations

**Key Features:**
- Custom PyObjectId handling for MongoDB
- JSON schema generation for API documentation
- Field validation with descriptive error messages
- Automatic serialization/deserialization

### Data Ingestion (`data_ingestion.py`)
Processes CSV datasets and generates realistic synthetic user interactions.

**Processing Pipeline:**
1. CSV data loading and validation
2. User session creation with timing simulation
3. Synthetic interaction generation (clicks, scrolls, hovers)
4. MongoDB document insertion with proper relationships
5. Vector embedding generation for ML models

**Synthetic Data Features:**
- Realistic user behavior simulation
- Device-specific interaction patterns
- Time-based session progression
- Conversion probability modeling

## Service Integration

### MongoDB Operations
- **Collections**: users, page_visits, user_interactions, user_sessions
- **Indexing**: Optimized queries with proper index strategy
- **Aggregation**: Complex analytics using MongoDB pipelines
- **Transactions**: Data consistency across related operations

### Milvus Vector Database
- **Collections**: user_behavior_embeddings, page_interaction_embeddings
- **Dimensions**: 128-dimensional vectors for similarity search
- **Indexing**: IVF_FLAT index for efficient similarity queries
- **Operations**: Insert, search, and similarity ranking

### Redis Caching Strategy
- **Metrics Cache**: Dashboard KPIs with TTL expiration
- **Session Cache**: User session data for real-time features
- **Query Cache**: Expensive analytics results
- **Real-time Data**: Live metrics for WebSocket updates

## API Endpoint Implementation

### Dashboard Endpoints
- Aggregate metrics calculation across time periods
- KPI computation with trend analysis
- Real-time metric updates via caching
- Historical data comparison and insights

### Funnel Analytics
- Multi-step conversion rate analysis
- Drop-off point identification with reasons
- Device-based funnel segmentation
- Time-series funnel performance tracking

### User Analytics
- Individual user journey reconstruction
- Behavior pattern analysis and clustering
- Similar user discovery using vector search
- Interaction heatmap data generation

### Sentiment Analysis
- Page-specific sentiment aggregation
- Trend analysis over time periods
- Sentiment distribution calculations
- User feedback categorization

### Machine Learning Integration
- Model training trigger endpoints
- Prediction and recommendation serving
- Model health monitoring and metrics
- Vector embedding generation and storage

## Performance Optimizations

### Async Processing
- Non-blocking database operations
- Concurrent request handling
- Background task execution
- Efficient resource utilization

### Caching Strategy
- Redis-based result caching
- TTL-based cache invalidation
- Cache-aside pattern implementation
- Hot data preloading

### Database Optimization
- Proper indexing strategy
- Aggregation pipeline optimization
- Connection pooling
- Query result pagination

### Memory Management
- Efficient data structure usage
- Garbage collection optimization
- Resource cleanup and connection closing
- Memory leak prevention

## Error Handling

### Exception Management
- Custom exception classes for different error types
- Comprehensive error logging with context
- User-friendly error messages
- Proper HTTP status code mapping

### Validation Errors
- Pydantic validation with detailed field errors
- Request parameter validation
- Data type checking and conversion
- Missing field handling

### Database Errors
- Connection failure handling
- Query timeout management
- Data integrity error handling
- Automatic retry mechanisms

## Configuration Management

### Environment Variables
- Database connection strings
- API keys and secrets
- Performance tuning parameters
- Feature flags and toggles

### Settings Management
- Centralized configuration handling
- Environment-specific settings
- Validation of configuration values
- Hot reloading support where applicable

## Monitoring and Logging

### Health Checks
- Database connectivity monitoring
- Service dependency health verification
- Performance metric tracking
- Resource utilization monitoring

### Logging Strategy
- Structured logging with context
- Request/response logging
- Error tracking and alerting
- Performance monitoring integration

## Security Considerations

### Data Protection
- Input sanitization and validation
- SQL injection prevention (NoSQL context)
- XSS protection through proper encoding
- Sensitive data handling

### API Security
- Rate limiting implementation ready
- CORS configuration for frontend access
- Request size limitations
- Error message sanitization

## Scalability Design

### Horizontal Scaling
- Stateless application design
- Database connection pooling
- Cache-friendly architecture
- Load balancer compatibility

### Performance Monitoring
- Response time tracking
- Database query performance
- Memory usage monitoring
- Concurrent request handling metrics