"""
FastAPI backend for comprehensive funnel analysis application.
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymilvus import connections, Collection
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from database_schema import (
    UserSession, PageVisit, UserInteraction, FunnelStep, 
    UserProfile, SentimentData, DeviceType, PageType
)
from analytics_engine import AnalyticsEngine
from two_tower_model import TwoTowerModel
from sentiment_analyzer import SentimentAnalyzer

load_dotenv()

# Global variables
mongodb_client: AsyncIOMotorClient = None
database = None
analytics_engine: AnalyticsEngine = None
two_tower_model: TwoTowerModel = None
sentiment_analyzer: SentimentAnalyzer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global mongodb_client, database, analytics_engine, two_tower_model, sentiment_analyzer
    
    # MongoDB connection
    mongodb_client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    database = mongodb_client.get_database(os.getenv("DATABASE_NAME", "funnel_analysis"))
    
    # Milvus connection
    connections.connect(
        alias="default",
        host=os.getenv("MILVUS_HOST", "localhost"),
        port=os.getenv("MILVUS_PORT", "19530")
    )
    
    # Initialize analytics components
    analytics_engine = AnalyticsEngine(database)
    two_tower_model = TwoTowerModel()
    sentiment_analyzer = SentimentAnalyzer()
    
    yield
    
    # Shutdown
    if mongodb_client:
        mongodb_client.close()

app = FastAPI(
    title="Advanced Funnel Analysis API",
    description="Comprehensive customer journey and drop-off analysis platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# Session tracking endpoints
@app.post("/api/sessions", response_model=Dict[str, str])
async def create_session(session: UserSession):
    """Create a new user session"""
    try:
        result = await database.sessions.insert_one(session.dict())
        await analytics_engine.update_real_time_metrics()
        return {"session_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/{session_id}/visits")
async def track_page_visit(session_id: str, visit: PageVisit):
    """Track a page visit within a session"""
    try:
        visit.session_id = session_id
        await database.page_visits.insert_one(visit.dict())
        
        # Update session metrics
        await database.sessions.update_one(
            {"session_id": session_id},
            {"$inc": {"pages_visited": 1}}
        )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/{session_id}/interactions")
async def track_interaction(session_id: str, interaction: UserInteraction):
    """Track user interaction"""
    try:
        interaction.session_id = session_id
        await database.interactions.insert_one(interaction.dict())
        
        # Update session metrics
        await database.sessions.update_one(
            {"session_id": session_id},
            {"$inc": {"interactions_count": 1}}
        )
        
        # Perform sentiment analysis if applicable
        if interaction.interaction_value:
            sentiment = await sentiment_analyzer.analyze(interaction.interaction_value)
            sentiment_data = SentimentData(
                sentiment_id=f"{interaction.interaction_id}_sentiment",
                session_id=session_id,
                interaction_id=interaction.interaction_id,
                **sentiment
            )
            await database.sentiment_data.insert_one(sentiment_data.dict())
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoints
@app.get("/api/analytics/funnel")
async def get_funnel_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    device_type: Optional[DeviceType] = Query(None)
):
    """Get comprehensive funnel analysis"""
    try:
        filters = {}
        if start_date and end_date:
            filters["date_range"] = (start_date, end_date)
        if device_type:
            filters["device_type"] = device_type
            
        result = await analytics_engine.get_funnel_analysis(filters)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/drop-off")
async def get_drop_off_analysis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get detailed drop-off analysis"""
    try:
        filters = {}
        if start_date and end_date:
            filters["date_range"] = (start_date, end_date)
            
        result = await analytics_engine.get_drop_off_analysis(filters)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/user-segments")
async def get_user_segments():
    """Get user segmentation analysis using two-tower model"""
    try:
        result = await two_tower_model.get_user_segments()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/sentiment")
async def get_sentiment_analysis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get sentiment analysis results"""
    try:
        filters = {}
        if start_date and end_date:
            filters["date_range"] = (start_date, end_date)
            
        result = await analytics_engine.get_sentiment_analysis(filters)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/real-time")
async def get_real_time_metrics():
    """Get real-time dashboard metrics"""
    try:
        result = await analytics_engine.get_real_time_metrics()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/cohort")
async def get_cohort_analysis(
    cohort_type: str = Query("weekly", description="daily, weekly, or monthly")
):
    """Get cohort analysis"""
    try:
        result = await analytics_engine.get_cohort_analysis(cohort_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/heatmap")
async def get_interaction_heatmap(
    page_type: PageType,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get interaction heatmap data for specific page"""
    try:
        filters = {"page_type": page_type}
        if start_date and end_date:
            filters["date_range"] = (start_date, end_date)
            
        result = await analytics_engine.get_interaction_heatmap(filters)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/user-journey")
async def get_user_journey_analysis(
    user_id: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None)
):
    """Get detailed user journey analysis"""
    try:
        if not user_id and not session_id:
            raise HTTPException(status_code=400, detail="Either user_id or session_id is required")
            
        result = await analytics_engine.get_user_journey_analysis(user_id, session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Data export endpoints
@app.get("/api/export/sessions")
async def export_sessions(
    start_date: str = Query(...),
    end_date: str = Query(...),
    format: str = Query("json", description="json or csv")
):
    """Export session data"""
    try:
        result = await analytics_engine.export_data("sessions", start_date, end_date, format)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )