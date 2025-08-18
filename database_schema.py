"""
Database schema definitions for comprehensive funnel analysis application.
Single source of truth for user interactions and page visits.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class DeviceType(str, Enum):
    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"

class InteractionType(str, Enum):
    CLICK = "click"
    HOVER = "hover"
    SCROLL = "scroll"
    BACK_PRESS = "back_press"
    FORM_SUBMIT = "form_submit"
    FORM_ABANDON = "form_abandon"
    PAGE_EXIT = "page_exit"
    SEARCH = "search"
    FILTER_APPLY = "filter_apply"
    PRODUCT_VIEW = "product_view"
    ADD_TO_CART = "add_to_cart"
    CHECKOUT_START = "checkout_start"
    PAYMENT_COMPLETE = "payment_complete"

class PageType(str, Enum):
    HOME = "home"
    SEARCH = "search"
    PRODUCT = "product"
    CART = "cart"
    CHECKOUT = "checkout"
    PAYMENT = "payment"
    CONFIRMATION = "confirmation"
    ERROR = "error"

class UserSession(BaseModel):
    """Single source of truth for user sessions and page visits"""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: Optional[str] = Field(None, description="User ID if known")
    device_type: DeviceType
    browser: str
    os: str
    ip_address: str
    user_agent: str
    country: Optional[str] = None
    city: Optional[str] = None
    session_start: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    session_end: Optional[datetime] = None
    total_duration: Optional[int] = Field(None, description="Session duration in seconds")
    pages_visited: int = Field(default=0)
    interactions_count: int = Field(default=0)
    conversion_achieved: bool = Field(default=False)
    conversion_value: Optional[float] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    referrer: Optional[str] = None

class PageVisit(BaseModel):
    """Page visit tracking within sessions"""
    visit_id: str = Field(..., description="Unique visit identifier")
    session_id: str = Field(..., description="Reference to UserSession")
    page_type: PageType
    page_url: str
    page_title: str
    entry_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    exit_time: Optional[datetime] = None
    duration: Optional[int] = Field(None, description="Time spent on page in seconds")
    scroll_depth: Optional[float] = Field(None, description="Max scroll depth as percentage")
    bounce: bool = Field(default=False, description="True if only page in session")
    conversion_page: bool = Field(default=False)
    exit_type: Optional[str] = Field(None, description="How user left the page")
    
class UserInteraction(BaseModel):
    """Detailed user interactions and behaviors"""
    interaction_id: str = Field(..., description="Unique interaction identifier")
    session_id: str = Field(..., description="Reference to UserSession")
    visit_id: str = Field(..., description="Reference to PageVisit")
    interaction_type: InteractionType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    element_id: Optional[str] = None
    element_class: Optional[str] = None
    element_text: Optional[str] = None
    x_coordinate: Optional[int] = None
    y_coordinate: Optional[int] = None
    page_x: Optional[int] = None
    page_y: Optional[int] = None
    viewport_width: Optional[int] = None
    viewport_height: Optional[int] = None
    interaction_value: Optional[str] = Field(None, description="Form values, search terms, etc.")
    interaction_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
class FunnelStep(BaseModel):
    """Funnel step definitions"""
    step_id: str
    step_name: str
    step_order: int
    page_types: List[PageType]
    required_interactions: List[InteractionType] = Field(default_factory=list)
    success_criteria: Dict[str, Any] = Field(default_factory=dict)

class UserProfile(BaseModel):
    """Enhanced user profile for two-tower model"""
    user_id: str
    demographic_vector: List[float] = Field(default_factory=list)
    behavioral_vector: List[float] = Field(default_factory=list)
    preference_vector: List[float] = Field(default_factory=list)
    session_count: int = Field(default=0)
    total_time_spent: int = Field(default=0)
    conversion_rate: float = Field(default=0.0)
    avg_session_duration: float = Field(default=0.0)
    favorite_pages: List[PageType] = Field(default_factory=list)
    drop_off_patterns: Dict[str, float] = Field(default_factory=dict)
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class SentimentData(BaseModel):
    """Sentiment analysis data"""
    sentiment_id: str
    session_id: str
    visit_id: Optional[str] = None
    interaction_id: Optional[str] = None
    sentiment_score: float = Field(..., description="Sentiment score -1 to 1")
    sentiment_label: str = Field(..., description="positive/negative/neutral")
    confidence: float = Field(..., description="Confidence score 0 to 1")
    text_content: Optional[str] = None
    analysis_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    analysis_model: str = Field(default="default")