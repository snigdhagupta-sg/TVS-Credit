from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from models import *
from database import init_database, close_database, get_database, get_milvus, MongoDB, MilvusDB
from analytics_engine import AnalyticsEngine
from two_tower_model import TwoTowerModel
from sentiment_analyzer import SentimentAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await init_database()
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    await close_database()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="Funnel Analysis API",
    description="Advanced funnel analysis with Two Tower model and sentiment analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
analytics_engine = AnalyticsEngine()
two_tower_model = TwoTowerModel()
sentiment_analyzer = SentimentAnalyzer()


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {"message": "Funnel Analysis API", "version": "1.0.0"}


@app.get("/health", response_model=Dict[str, str])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Dashboard endpoints
@app.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: MongoDB = Depends(get_database)
):
    """Get comprehensive dashboard metrics"""
    try:
        # Parse dates
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        else:
            start_dt = datetime.utcnow() - timedelta(days=30)
            
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        else:
            end_dt = datetime.utcnow()
        
        metrics = await analytics_engine.get_dashboard_metrics(db, start_dt, end_dt)
        return metrics
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/funnel/analysis", response_model=List[FunnelAnalysisResponse])
async def get_funnel_analysis(
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: MongoDB = Depends(get_database)
):
    """Get detailed funnel analysis"""
    try:
        # Parse dates
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        else:
            start_dt = datetime.utcnow() - timedelta(days=30)
            
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        else:
            end_dt = datetime.utcnow()
        
        analysis = await analytics_engine.get_funnel_analysis(
            db, device_type, start_dt, end_dt
        )
        return analysis
        
    except Exception as e:
        logger.error(f"Error getting funnel analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/funnel/dropoff", response_model=List[Dict[str, Any]])
async def get_dropoff_analysis(
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    limit: int = Query(10, description="Number of top drop-off points"),
    db: MongoDB = Depends(get_database)
):
    """Get detailed drop-off analysis"""
    try:
        dropoff_data = await analytics_engine.get_dropoff_analysis(
            db, device_type, limit
        )
        return dropoff_data
        
    except Exception as e:
        logger.error(f"Error getting drop-off analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/behavior", response_model=UserBehaviorResponse)
async def get_user_behavior(
    user_id: str,
    db: MongoDB = Depends(get_database)
):
    """Get detailed user behavior analysis"""
    try:
        behavior = await analytics_engine.get_user_behavior(db, user_id)
        if not behavior:
            raise HTTPException(status_code=404, detail="User not found")
        return behavior
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user behavior: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/similar/{user_id}", response_model=List[Dict[str, Any]])
async def get_similar_users(
    user_id: str,
    limit: int = Query(10, description="Number of similar users to return"),
    device_filter: Optional[str] = Query(None, description="Filter by device type"),
    db: MongoDB = Depends(get_database),
    milvus: MilvusDB = Depends(get_milvus)
):
    """Get similar users using Two Tower model"""
    try:
        similar_users = await two_tower_model.find_similar_users(
            db, milvus, user_id, limit, device_filter
        )
        return similar_users
        
    except Exception as e:
        logger.error(f"Error finding similar users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sentiment/analysis", response_model=List[Dict[str, Any]])
async def get_sentiment_analysis(
    page: Optional[str] = Query(None, description="Filter by page"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: MongoDB = Depends(get_database)
):
    """Get sentiment analysis for user interactions"""
    try:
        # Parse dates
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        else:
            start_dt = datetime.utcnow() - timedelta(days=30)
            
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        else:
            end_dt = datetime.utcnow()
        
        sentiment_data = await sentiment_analyzer.get_sentiment_analysis(
            db, page, start_dt, end_dt
        )
        return sentiment_data
        
    except Exception as e:
        logger.error(f"Error getting sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/conversion-trends", response_model=List[Dict[str, Any]])
async def get_conversion_trends(
    period: str = Query("daily", description="Aggregation period (daily, weekly, monthly)"),
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: MongoDB = Depends(get_database)
):
    """Get conversion rate trends over time"""
    try:
        # Parse dates
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        else:
            start_dt = datetime.utcnow() - timedelta(days=30)
            
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        else:
            end_dt = datetime.utcnow()
        
        trends = await analytics_engine.get_conversion_trends(
            db, period, device_type, start_dt, end_dt
        )
        return trends
        
    except Exception as e:
        logger.error(f"Error getting conversion trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/user-journey", response_model=List[Dict[str, Any]])
async def get_user_journey_patterns(
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    min_sessions: int = Query(2, description="Minimum sessions for pattern analysis"),
    db: MongoDB = Depends(get_database)
):
    """Get common user journey patterns"""
    try:
        patterns = await analytics_engine.get_user_journey_patterns(
            db, device_type, min_sessions
        )
        return patterns
        
    except Exception as e:
        logger.error(f"Error getting user journey patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/cohort", response_model=List[Dict[str, Any]])
async def get_cohort_analysis(
    cohort_type: str = Query("weekly", description="Cohort type (daily, weekly, monthly)"),
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    db: MongoDB = Depends(get_database)
):
    """Get cohort analysis for user retention"""
    try:
        cohort_data = await analytics_engine.get_cohort_analysis(
            db, cohort_type, device_type
        )
        return cohort_data
        
    except Exception as e:
        logger.error(f"Error getting cohort analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Data ingestion endpoints
@app.post("/data/ingest/users")
async def ingest_users(
    users: List[User],
    db: MongoDB = Depends(get_database)
):
    """Ingest user data"""
    try:
        collection = db.get_collection("users")
        user_dicts = [user.dict(by_alias=True, exclude={"id"}) for user in users]
        result = await collection.insert_many(user_dicts)
        
        return {
            "message": f"Ingested {len(result.inserted_ids)} users",
            "inserted_count": len(result.inserted_ids)
        }
        
    except Exception as e:
        logger.error(f"Error ingesting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/data/ingest/page-visits")
async def ingest_page_visits(
    visits: List[PageVisit],
    db: MongoDB = Depends(get_database)
):
    """Ingest page visit data"""
    try:
        collection = db.get_collection("page_visits")
        visit_dicts = [visit.dict(by_alias=True, exclude={"id"}) for visit in visits]
        result = await collection.insert_many(visit_dicts)
        
        return {
            "message": f"Ingested {len(result.inserted_ids)} page visits",
            "inserted_count": len(result.inserted_ids)
        }
        
    except Exception as e:
        logger.error(f"Error ingesting page visits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/data/ingest/interactions")
async def ingest_interactions(
    interactions: List[UserInteraction],
    db: MongoDB = Depends(get_database)
):
    """Ingest user interaction data"""
    try:
        collection = db.get_collection("user_interactions")
        interaction_dicts = [
            interaction.dict(by_alias=True, exclude={"id"}) 
            for interaction in interactions
        ]
        result = await collection.insert_many(interaction_dicts)
        
        return {
            "message": f"Ingested {len(result.inserted_ids)} interactions",
            "inserted_count": len(result.inserted_ids)
        }
        
    except Exception as e:
        logger.error(f"Error ingesting interactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analytics/refresh")
async def refresh_analytics(
    db: MongoDB = Depends(get_database)
):
    """Refresh analytics calculations"""
    try:
        await analytics_engine.refresh_analytics(db)
        return {"message": "Analytics refreshed successfully"}
        
    except Exception as e:
        logger.error(f"Error refreshing analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/retrain")
async def retrain_models(
    db: MongoDB = Depends(get_database),
    milvus: MilvusDB = Depends(get_milvus)
):
    """Retrain Two Tower model and update embeddings"""
    try:
        await two_tower_model.retrain_model(db, milvus)
        return {"message": "Models retrained successfully"}
        
    except Exception as e:
        logger.error(f"Error retraining models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )