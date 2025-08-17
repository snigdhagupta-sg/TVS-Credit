# Funnel Analysis Application

A comprehensive e-commerce funnel analysis application built with FastAPI, MongoDB, Milvus, and advanced machine learning models including Two Tower architecture for user behavior analysis and sentiment analysis.

## Features

### 🎯 Core Analytics
- **Funnel Visualization**: Complete conversion funnel from home page to purchase confirmation
- **Drop-off Analysis**: Identify where users are leaving the funnel
- **Device Segmentation**: Separate analysis for Desktop vs Mobile users
- **Conversion Trends**: Time-based conversion rate analysis

### 🤖 Advanced ML Models
- **Two Tower Model**: Deep learning model for user-item interaction analysis
- **User Similarity**: Find similar users based on behavior patterns
- **Sentiment Analysis**: Analyze user sentiment from interaction patterns
- **Behavioral Clustering**: Group users by similar journey patterns

### 📊 Interactive Dashboard
- Real-time metrics and KPIs
- Interactive funnel visualization
- Sentiment analysis with confidence scores
- User journey pattern analysis
- Cohort retention analysis

### 🔧 Technical Features
- **Vector Database**: Milvus for similarity search and recommendations
- **Scalable Backend**: FastAPI with async/await support
- **Flexible Data Models**: Comprehensive MongoDB schema
- **Synthetic Data Generation**: Generate realistic user interactions

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   MongoDB       │
│   Dashboard     │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Milvus        │    │   Two Tower     │
                       │   Vector DB     │◄──►│   ML Model      │
                       └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### 1. Start Backend Services

```bash
# Clone and navigate to project
cd funnel_analysis

# Start all services (MongoDB, Milvus, Redis)
docker-compose up -d

# Wait for services to be ready (about 2-3 minutes)
docker-compose logs -f
```

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt
```

### 3. Ingest Sample Data

```bash
# Run data ingestion (converts CSV to MongoDB with synthetic interactions)
python data_ingestion.py
```

### 4. Start API Server

```bash
# Start FastAPI application
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access the API

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Dashboard Metrics**: http://localhost:8000/dashboard/metrics

## API Endpoints

### Dashboard & Analytics
```
GET  /dashboard/metrics              # Main dashboard KPIs
GET  /funnel/analysis               # Funnel conversion analysis
GET  /funnel/dropoff                # Drop-off point analysis
GET  /analytics/conversion-trends   # Conversion trends over time
GET  /analytics/user-journey        # Common user journey patterns
GET  /analytics/cohort              # Cohort retention analysis
```

### User Behavior
```
GET  /users/{user_id}/behavior      # Individual user behavior
GET  /users/similar/{user_id}       # Find similar users (Two Tower)
```

### Sentiment Analysis
```
GET  /sentiment/analysis            # Sentiment analysis by page
```

### Model Operations
```
POST /models/retrain                # Retrain Two Tower model
POST /analytics/refresh             # Refresh analytics cache
```

## Data Models

### User Journey Data
- **Users**: Demographics, device type, registration date
- **Page Visits**: Timestamped page visits with duration
- **User Interactions**: Detailed click, scroll, form interactions
- **Sessions**: Complete user sessions with conversion status

### Analytics Data
- **Funnel Analytics**: Pre-computed funnel metrics
- **Sentiment Analysis**: User sentiment scores and patterns
- **User Embeddings**: Vector representations for similarity search

## Machine Learning Models

### Two Tower Architecture
```python
# User Tower: Encodes user features
user_features = [user_id, device, session_count, interaction_count, avg_time]
user_embedding = user_tower(user_features)  # 128-dim vector

# Item Tower: Encodes page/interaction features  
item_features = [page, interaction_type, click_rate, time_spent, conversion_rate]
item_embedding = item_tower(item_features)  # 128-dim vector

# Similarity Score
similarity = dot_product(user_embedding, item_embedding)
```

### Sentiment Analysis
```python
# Pattern-based sentiment analysis
patterns = {
    'frustrated': ['back', 'multiple_clicks', 'rapid_scrolling'],
    'engaged': ['click', 'scroll', 'hover', 'form_fill'],
    'satisfied': ['purchase', 'form_submit', 'long_session']
}

sentiment_score = (positive_patterns - negative_patterns) / total_patterns
```

## Database Schema

### MongoDB Collections

```javascript
// Users collection
{
  user_id: "12345",
  date: ISODate("2015-01-01"),
  device: "Desktop",
  sex: "Male"
}

// Page visits collection  
{
  user_id: "12345",
  page: "home_page",
  timestamp: ISODate("2015-01-01T10:00:00"),
  duration: 120,
  session_id: "sess_001"
}

// User interactions collection
{
  user_id: "12345", 
  page: "home_page",
  interaction_type: "click",
  element_id: "hero_button",
  coordinates: {x: 500, y: 300},
  timestamp: ISODate("2015-01-01T10:01:00")
}
```

### Milvus Collections

```python
# User behavior embeddings
user_behavior_embeddings = {
  id: int64,
  user_id: varchar,
  embedding: float_vector[128],
  device_type: varchar,
  timestamp: int64
}

# Page interaction embeddings
page_interaction_embeddings = {
  id: int64,
  page: varchar, 
  embedding: float_vector[128],
  interaction_type: varchar,
  timestamp: int64
}
```

## Configuration

### Environment Variables
```bash
# Database connections
MONGODB_URL=mongodb://admin:password123@localhost:27017/funnel_analysis?authSource=admin
MILVUS_HOST=localhost
MILVUS_PORT=19530
REDIS_URL=redis://localhost:6379

# API settings
API_HOST=0.0.0.0
API_PORT=8000
```

### Docker Compose Services
- **MongoDB**: Document database with authentication
- **Milvus**: Vector database with etcd and MinIO dependencies  
- **Redis**: Caching and session storage
- **App**: FastAPI application container

## Development

### Project Structure
```
funnel_analysis/
├── app.py                 # FastAPI application
├── models.py              # Pydantic data models
├── database.py            # Database connections
├── analytics_engine.py    # Core analytics logic
├── two_tower_model.py     # ML model implementation
├── sentiment_analyzer.py  # Sentiment analysis
├── data_ingestion.py      # CSV to MongoDB pipeline
├── data/                  # Original CSV files
├── docker-compose.yml     # Service orchestration
└── FRONTEND.md           # Frontend development guide
```

### Adding New Analytics

1. **Create endpoint in app.py**:
```python
@app.get("/analytics/new-metric")
async def get_new_metric(db: MongoDB = Depends(get_database)):
    return await analytics_engine.calculate_new_metric(db)
```

2. **Implement logic in analytics_engine.py**:
```python
async def calculate_new_metric(self, db: MongoDB):
    # Your analytics logic here
    return results
```

3. **Add data model in models.py**:
```python
class NewMetricResponse(BaseModel):
    metric_value: float
    # Additional fields
```

## Frontend Integration

The application includes a comprehensive Next.js frontend. See [FRONTEND.md](FRONTEND.md) for detailed setup instructions.

### Key Frontend Features
- **shadcn/ui Components**: Modern, accessible UI components
- **Real-time Updates**: Live dashboard with auto-refresh
- **Interactive Charts**: Recharts visualizations
- **Responsive Design**: Mobile-first responsive layout
- **TypeScript**: Full type safety

## Performance Optimization

### Database Indexing
```javascript
// MongoDB indexes for optimal query performance
db.users.createIndex({user_id: 1}, {unique: true})
db.page_visits.createIndex({user_id: 1, timestamp: -1})
db.user_interactions.createIndex({user_id: 1, timestamp: -1})
db.user_sessions.createIndex({session_id: 1}, {unique: true})
```

### Caching Strategy
- Redis caching for frequently accessed analytics
- Pre-computed funnel metrics
- Cached ML model predictions

### Vector Search Optimization
- IVF_FLAT index for fast similarity search
- 128-dimensional embeddings for optimal performance
- Batch embedding updates

## Monitoring & Observability

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "mongodb": "connected",
            "milvus": "connected", 
            "redis": "connected"
        }
    }
```

### Logging
- Structured logging with loguru
- Request/response logging
- Error tracking and alerting

## Deployment

### Production Setup
1. **Environment Configuration**: Update environment variables for production
2. **Database Security**: Configure proper authentication and SSL
3. **API Security**: Add authentication middleware if needed
4. **Monitoring**: Set up application monitoring and alerting
5. **Scaling**: Configure horizontal scaling for high traffic

### Docker Production
```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the frontend guide in `FRONTEND.md`