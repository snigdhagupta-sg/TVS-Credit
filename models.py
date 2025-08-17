from datetime import datetime
from typing import Optional, List, Dict, Any, Annotated
from pydantic import BaseModel, Field, BeforeValidator, PlainSerializer, WithJsonSchema
from bson import ObjectId


def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return ObjectId(v)
    raise ValueError("Invalid ObjectId")


def serialize_object_id(v: ObjectId) -> str:
    return str(v)


PyObjectId = Annotated[
    ObjectId,
    BeforeValidator(validate_object_id),
    PlainSerializer(serialize_object_id, return_type=str),
    WithJsonSchema({"type": "string", "pattern": "^[0-9a-fA-F]{24}$"})
]


class User(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: str = Field(..., description="Unique user identifier")
    date: datetime = Field(..., description="User registration/first visit date")
    device: str = Field(..., description="Device type (Desktop/Mobile)")
    sex: str = Field(..., description="User gender")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PageVisit(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: str = Field(..., description="User identifier")
    page: str = Field(..., description="Page name (home_page, search_page, etc.)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Visit timestamp")
    session_id: Optional[str] = Field(None, description="Session identifier")
    referrer: Optional[str] = Field(None, description="Previous page")
    duration: Optional[int] = Field(None, description="Time spent on page in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserInteraction(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: str = Field(..., description="User identifier")
    page: str = Field(..., description="Page where interaction occurred")
    interaction_type: str = Field(..., description="Type of interaction (click, scroll, back, etc.)")
    element_id: Optional[str] = Field(None, description="ID of interacted element")
    element_type: Optional[str] = Field(None, description="Type of element (button, link, etc.)")
    coordinates: Optional[Dict[str, int]] = Field(None, description="Click coordinates {x, y}")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = Field(None, description="Session identifier")
    metadata: Optional[Dict[str, Any]] = Field({}, description="Additional interaction data")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserSession(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: str = Field(..., description="User identifier")
    session_id: str = Field(..., description="Unique session identifier")
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = Field(None)
    pages_visited: List[str] = Field(default_factory=list)
    total_interactions: int = Field(default=0)
    device: str = Field(..., description="Device type")
    user_agent: Optional[str] = Field(None)
    ip_address: Optional[str] = Field(None)
    conversion_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class FunnelAnalytics(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    date: datetime = Field(..., description="Analysis date")
    device_type: str = Field(..., description="Device type for analysis")
    funnel_step: str = Field(..., description="Funnel step name")
    total_users: int = Field(..., description="Total users at this step")
    converted_users: int = Field(..., description="Users who proceeded to next step")
    conversion_rate: float = Field(..., description="Conversion rate percentage")
    drop_off_rate: float = Field(..., description="Drop-off rate percentage")
    avg_time_spent: Optional[float] = Field(None, description="Average time spent at this step")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class SentimentAnalysis(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: str = Field(..., description="User identifier")
    page: str = Field(..., description="Page where sentiment was analyzed")
    sentiment_score: float = Field(..., description="Sentiment score (-1 to 1)")
    sentiment_label: str = Field(..., description="Sentiment label (positive/negative/neutral)")
    confidence: float = Field(..., description="Confidence score")
    interaction_patterns: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Response models for API
class FunnelStepResponse(BaseModel):
    step: str
    total_users: int
    conversion_rate: float
    drop_off_rate: float
    avg_time_spent: Optional[float]


class FunnelAnalysisResponse(BaseModel):
    device_type: str
    total_users: int
    steps: List[FunnelStepResponse]
    overall_conversion_rate: float


class UserBehaviorResponse(BaseModel):
    user_id: str
    device: str
    total_sessions: int
    total_interactions: int
    pages_visited: List[str]
    conversion_completed: bool
    sentiment_score: Optional[float]


class DashboardMetrics(BaseModel):
    total_users: int
    total_sessions: int
    overall_conversion_rate: float
    mobile_vs_desktop_conversion: Dict[str, float]
    top_drop_off_points: List[Dict[str, Any]]
    daily_metrics: List[Dict[str, Any]]
    sentiment_distribution: Dict[str, int]