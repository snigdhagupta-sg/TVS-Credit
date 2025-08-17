import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import logging
from collections import defaultdict, Counter
from database import MongoDB
from models import DashboardMetrics, FunnelAnalysisResponse, FunnelStepResponse, UserBehaviorResponse
import asyncio

logger = logging.getLogger(__name__)


class AnalyticsEngine:
    def __init__(self):
        self.funnel_steps = [
            'home_page',
            'search_page', 
            'payment_page',
            'payment_confirmation_page'
        ]
        
    async def get_dashboard_metrics(
        self, 
        db: MongoDB, 
        start_date: datetime, 
        end_date: datetime
    ) -> DashboardMetrics:
        """Get comprehensive dashboard metrics"""
        try:
            # Get total users
            users_collection = db.get_collection("users")
            total_users = await users_collection.count_documents({
                "date": {"$gte": start_date, "$lte": end_date}
            })
            
            # Get total sessions
            sessions_collection = db.get_collection("user_sessions")
            total_sessions = await sessions_collection.count_documents({
                "start_time": {"$gte": start_date, "$lte": end_date}
            })
            
            # Calculate overall conversion rate
            converted_sessions = await sessions_collection.count_documents({
                "start_time": {"$gte": start_date, "$lte": end_date},
                "conversion_completed": True
            })
            
            overall_conversion_rate = (converted_sessions / max(1, total_sessions)) * 100
            
            # Mobile vs Desktop conversion
            mobile_vs_desktop = await self._get_device_conversion_rates(
                db, start_date, end_date
            )
            
            # Top drop-off points
            drop_off_points = await self.get_dropoff_analysis(db, None, 5)
            
            # Daily metrics
            daily_metrics = await self._get_daily_metrics(db, start_date, end_date)
            
            # Sentiment distribution
            sentiment_distribution = await self._get_sentiment_distribution(
                db, start_date, end_date
            )
            
            return DashboardMetrics(
                total_users=total_users,
                total_sessions=total_sessions,
                overall_conversion_rate=round(overall_conversion_rate, 2),
                mobile_vs_desktop_conversion=mobile_vs_desktop,
                top_drop_off_points=drop_off_points,
                daily_metrics=daily_metrics,
                sentiment_distribution=sentiment_distribution
            )
            
        except Exception as e:
            logger.error(f"Error getting dashboard metrics: {e}")
            raise
    
    async def _get_device_conversion_rates(
        self, 
        db: MongoDB, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, float]:
        """Get conversion rates by device type"""
        sessions_collection = db.get_collection("user_sessions")
        
        pipeline = [
            {
                "$match": {
                    "start_time": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$device",
                    "total_sessions": {"$sum": 1},
                    "converted_sessions": {
                        "$sum": {"$cond": ["$conversion_completed", 1, 0]}
                    }
                }
            }
        ]
        
        device_stats = {}
        cursor = sessions_collection.aggregate(pipeline)
        
        async for doc in cursor:
            device = doc['_id']
            total = doc['total_sessions']
            converted = doc['converted_sessions']
            conversion_rate = (converted / max(1, total)) * 100
            device_stats[device] = round(conversion_rate, 2)
        
        return device_stats
    
    async def _get_daily_metrics(
        self, 
        db: MongoDB, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get daily metrics for the dashboard"""
        sessions_collection = db.get_collection("user_sessions")
        
        pipeline = [
            {
                "$match": {
                    "start_time": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$start_time"},
                        "month": {"$month": "$start_time"},
                        "day": {"$dayOfMonth": "$start_time"}
                    },
                    "sessions": {"$sum": 1},
                    "conversions": {
                        "$sum": {"$cond": ["$conversion_completed", 1, 0]}
                    },
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        daily_data = []
        cursor = sessions_collection.aggregate(pipeline)
        
        async for doc in cursor:
            date_info = doc['_id']
            date_str = f"{date_info['year']}-{date_info['month']:02d}-{date_info['day']:02d}"
            
            sessions = doc['sessions']
            conversions = doc['conversions']
            unique_users = len(doc['unique_users'])
            
            conversion_rate = (conversions / max(1, sessions)) * 100
            
            daily_data.append({
                'date': date_str,
                'sessions': sessions,
                'conversions': conversions,
                'unique_users': unique_users,
                'conversion_rate': round(conversion_rate, 2)
            })
        
        return daily_data
    
    async def _get_sentiment_distribution(
        self, 
        db: MongoDB, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, int]:
        """Get sentiment distribution for the time period"""
        sentiment_collection = db.get_collection("sentiment_analysis")
        
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$sentiment_label",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        sentiment_dist = {"positive": 0, "neutral": 0, "negative": 0}
        cursor = sentiment_collection.aggregate(pipeline)
        
        async for doc in cursor:
            label = doc['_id']
            count = doc['count']
            if label in sentiment_dist:
                sentiment_dist[label] = count
        
        return sentiment_dist
    
    async def get_funnel_analysis(
        self,
        db: MongoDB,
        device_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[FunnelAnalysisResponse]:
        """Get detailed funnel analysis"""
        try:
            # Build query
            query = {}
            if start_date or end_date:
                query["start_time"] = {}
                if start_date:
                    query["start_time"]["$gte"] = start_date
                if end_date:
                    query["start_time"]["$lte"] = end_date
            
            if device_type:
                query["device"] = device_type
            
            sessions_collection = db.get_collection("user_sessions")
            
            # Get all sessions
            sessions = []
            async for session in sessions_collection.find(query):
                sessions.append(session)
            
            if not sessions:
                return []
            
            # Group by device type if not specified
            if not device_type:
                device_groups = defaultdict(list)
                for session in sessions:
                    device = session.get('device', 'Unknown')
                    device_groups[device].append(session)
                
                results = []
                for device, device_sessions in device_groups.items():
                    analysis = self._calculate_funnel_metrics(device_sessions, device)
                    results.append(analysis)
                
                return results
            else:
                # Single device analysis
                analysis = self._calculate_funnel_metrics(sessions, device_type)
                return [analysis]
            
        except Exception as e:
            logger.error(f"Error getting funnel analysis: {e}")
            raise
    
    def _calculate_funnel_metrics(
        self, 
        sessions: List[Dict[str, Any]], 
        device_type: str
    ) -> FunnelAnalysisResponse:
        """Calculate funnel metrics for a set of sessions"""
        if not sessions:
            return FunnelAnalysisResponse(
                device_type=device_type,
                total_users=0,
                steps=[],
                overall_conversion_rate=0.0
            )
        
        # Count users at each step
        step_counts = {}
        total_users = len(sessions)
        
        for step in self.funnel_steps:
            step_counts[step] = sum(
                1 for session in sessions 
                if step in session.get('pages_visited', [])
            )
        
        # Calculate conversion rates and create steps
        steps = []
        for i, step in enumerate(self.funnel_steps):
            current_count = step_counts[step]
            
            if i == 0:
                # First step - conversion rate is always 100% for users who reach it
                conversion_rate = 100.0 if current_count > 0 else 0.0
                drop_off_rate = 0.0
            else:
                # Subsequent steps - calculate based on previous step
                previous_count = step_counts[self.funnel_steps[i-1]]
                if previous_count > 0:
                    conversion_rate = (current_count / previous_count) * 100
                    drop_off_rate = ((previous_count - current_count) / previous_count) * 100
                else:
                    conversion_rate = 0.0
                    drop_off_rate = 0.0
            
            # Calculate average time spent (mock calculation)
            avg_time_spent = self._calculate_avg_time_on_step(sessions, step)
            
            step_response = FunnelStepResponse(
                step=step,
                total_users=current_count,
                conversion_rate=round(conversion_rate, 2),
                drop_off_rate=round(drop_off_rate, 2),
                avg_time_spent=avg_time_spent
            )
            steps.append(step_response)
        
        # Calculate overall conversion rate (home to confirmation)
        home_users = step_counts.get('home_page', 0)
        confirmation_users = step_counts.get('payment_confirmation_page', 0)
        overall_conversion = (confirmation_users / max(1, home_users)) * 100
        
        return FunnelAnalysisResponse(
            device_type=device_type,
            total_users=total_users,
            steps=steps,
            overall_conversion_rate=round(overall_conversion, 2)
        )
    
    def _calculate_avg_time_on_step(
        self, 
        sessions: List[Dict[str, Any]], 
        step: str
    ) -> Optional[float]:
        """Calculate average time spent on a specific step"""
        # This is a simplified calculation
        # In a real scenario, you'd calculate based on actual timestamps
        times = []
        for session in sessions:
            if step in session.get('pages_visited', []):
                # Mock calculation based on session duration
                if session.get('end_time') and session.get('start_time'):
                    total_duration = (session['end_time'] - session['start_time']).total_seconds()
                    pages_count = len(session.get('pages_visited', []))
                    if pages_count > 0:
                        avg_time_per_page = total_duration / pages_count
                        times.append(avg_time_per_page)
        
        return round(np.mean(times), 2) if times else None
    
    async def get_dropoff_analysis(
        self, 
        db: MongoDB, 
        device_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get detailed drop-off analysis"""
        try:
            query = {}
            if device_type:
                query["device"] = device_type
            
            sessions_collection = db.get_collection("user_sessions")
            
            # Get all sessions
            sessions = []
            async for session in sessions_collection.find(query):
                sessions.append(session)
            
            if not sessions:
                return []
            
            # Calculate drop-off rates between consecutive steps
            dropoff_points = []
            
            for i in range(len(self.funnel_steps) - 1):
                current_step = self.funnel_steps[i]
                next_step = self.funnel_steps[i + 1]
                
                # Count users who reached current step
                current_users = sum(
                    1 for session in sessions 
                    if current_step in session.get('pages_visited', [])
                )
                
                # Count users who reached next step
                next_users = sum(
                    1 for session in sessions 
                    if next_step in session.get('pages_visited', [])
                )
                
                if current_users > 0:
                    dropoff_rate = ((current_users - next_users) / current_users) * 100
                    dropoff_count = current_users - next_users
                    
                    dropoff_points.append({
                        'from_step': current_step,
                        'to_step': next_step,
                        'dropoff_count': dropoff_count,
                        'dropoff_rate': round(dropoff_rate, 2),
                        'users_at_step': current_users,
                        'users_continued': next_users
                    })
            
            # Sort by drop-off rate (highest first)
            dropoff_points.sort(key=lambda x: x['dropoff_rate'], reverse=True)
            
            return dropoff_points[:limit]
            
        except Exception as e:
            logger.error(f"Error getting drop-off analysis: {e}")
            raise
    
    async def get_user_behavior(
        self, 
        db: MongoDB, 
        user_id: str
    ) -> Optional[UserBehaviorResponse]:
        """Get detailed behavior analysis for a specific user"""
        try:
            # Get user basic info
            users_collection = db.get_collection("users")
            user = await users_collection.find_one({"user_id": user_id})
            
            if not user:
                return None
            
            # Get user sessions
            sessions_collection = db.get_collection("user_sessions")
            sessions = []
            async for session in sessions_collection.find({"user_id": user_id}):
                sessions.append(session)
            
            # Get user interactions
            interactions_collection = db.get_collection("user_interactions")
            interaction_count = await interactions_collection.count_documents({"user_id": user_id})
            
            # Get all pages visited
            all_pages = set()
            conversion_completed = False
            
            for session in sessions:
                pages = session.get('pages_visited', [])
                all_pages.update(pages)
                if session.get('conversion_completed', False):
                    conversion_completed = True
            
            # Get sentiment analysis
            sentiment_collection = db.get_collection("sentiment_analysis")
            sentiment_doc = await sentiment_collection.find_one(
                {"user_id": user_id},
                sort=[("timestamp", -1)]
            )
            
            sentiment_score = sentiment_doc.get('sentiment_score', 0.0) if sentiment_doc else None
            
            return UserBehaviorResponse(
                user_id=user_id,
                device=user.get('device', 'Unknown'),
                total_sessions=len(sessions),
                total_interactions=interaction_count,
                pages_visited=list(all_pages),
                conversion_completed=conversion_completed,
                sentiment_score=sentiment_score
            )
            
        except Exception as e:
            logger.error(f"Error getting user behavior for {user_id}: {e}")
            raise
    
    async def get_conversion_trends(
        self,
        db: MongoDB,
        period: str = 'daily',
        device_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get conversion rate trends over time"""
        try:
            # Build match query
            match_query = {}
            if device_type:
                match_query["device"] = device_type
            if start_date or end_date:
                match_query["start_time"] = {}
                if start_date:
                    match_query["start_time"]["$gte"] = start_date
                if end_date:
                    match_query["start_time"]["$lte"] = end_date
            
            # Build group stage based on period
            if period == 'daily':
                group_id = {
                    "year": {"$year": "$start_time"},
                    "month": {"$month": "$start_time"}, 
                    "day": {"$dayOfMonth": "$start_time"}
                }
            elif period == 'weekly':
                group_id = {
                    "year": {"$year": "$start_time"},
                    "week": {"$week": "$start_time"}
                }
            else:  # monthly
                group_id = {
                    "year": {"$year": "$start_time"},
                    "month": {"$month": "$start_time"}
                }
            
            sessions_collection = db.get_collection("user_sessions")
            
            pipeline = [
                {"$match": match_query},
                {
                    "$group": {
                        "_id": group_id,
                        "total_sessions": {"$sum": 1},
                        "conversions": {
                            "$sum": {"$cond": ["$conversion_completed", 1, 0]}
                        },
                        "unique_users": {"$addToSet": "$user_id"}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            
            trends = []
            cursor = sessions_collection.aggregate(pipeline)
            
            async for doc in cursor:
                date_info = doc['_id']
                
                # Create date string
                if period == 'daily':
                    date_str = f"{date_info['year']}-{date_info['month']:02d}-{date_info['day']:02d}"
                elif period == 'weekly':
                    date_str = f"{date_info['year']}-W{date_info['week']:02d}"
                else:
                    date_str = f"{date_info['year']}-{date_info['month']:02d}"
                
                total_sessions = doc['total_sessions']
                conversions = doc['conversions']
                unique_users = len(doc['unique_users'])
                
                conversion_rate = (conversions / max(1, total_sessions)) * 100
                
                trends.append({
                    'date': date_str,
                    'period': period,
                    'total_sessions': total_sessions,
                    'conversions': conversions,
                    'unique_users': unique_users,
                    'conversion_rate': round(conversion_rate, 2)
                })
            
            return trends
            
        except Exception as e:
            logger.error(f"Error getting conversion trends: {e}")
            raise
    
    async def get_user_journey_patterns(
        self,
        db: MongoDB,
        device_type: Optional[str] = None,
        min_sessions: int = 2
    ) -> List[Dict[str, Any]]:
        """Get common user journey patterns"""
        try:
            query = {}
            if device_type:
                query["device"] = device_type
            
            sessions_collection = db.get_collection("user_sessions")
            
            # Get all user journeys
            user_journeys = defaultdict(list)
            async for session in sessions_collection.find(query):
                user_id = session['user_id']
                pages = session.get('pages_visited', [])
                if pages:
                    journey = ' -> '.join(pages)
                    user_journeys[user_id].append(journey)
            
            # Find common patterns
            journey_patterns = Counter()
            for user_id, journeys in user_journeys.items():
                if len(journeys) >= min_sessions:
                    # Count unique journey patterns for this user
                    for journey in set(journeys):  # Use set to count unique patterns only
                        journey_patterns[journey] += 1
            
            # Convert to list of dictionaries
            patterns = []
            for journey, count in journey_patterns.most_common(20):  # Top 20 patterns
                patterns.append({
                    'journey_pattern': journey,
                    'user_count': count,
                    'percentage': round((count / len(user_journeys)) * 100, 2)
                })
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error getting user journey patterns: {e}")
            raise
    
    async def get_cohort_analysis(
        self,
        db: MongoDB,
        cohort_type: str = 'weekly',
        device_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get cohort analysis for user retention"""
        try:
            # This is a simplified cohort analysis
            # In a full implementation, you'd track user return behavior over time
            
            users_collection = db.get_collection("users")
            sessions_collection = db.get_collection("user_sessions")
            
            query = {}
            if device_type:
                query["device"] = device_type
            
            # Group users by cohort (registration period)
            if cohort_type == 'daily':
                group_id = {
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"},
                    "day": {"$dayOfMonth": "$date"}
                }
            elif cohort_type == 'weekly':
                group_id = {
                    "year": {"$year": "$date"},
                    "week": {"$week": "$date"}
                }
            else:  # monthly
                group_id = {
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"}
                }
            
            pipeline = [
                {"$match": query},
                {
                    "$group": {
                        "_id": group_id,
                        "user_ids": {"$push": "$user_id"},
                        "cohort_size": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            
            cohorts = []
            cursor = users_collection.aggregate(pipeline)
            
            async for doc in cursor:
                date_info = doc['_id']
                user_ids = doc['user_ids']
                cohort_size = doc['cohort_size']
                
                # Create cohort date string
                if cohort_type == 'daily':
                    cohort_date = f"{date_info['year']}-{date_info['month']:02d}-{date_info['day']:02d}"
                elif cohort_type == 'weekly':
                    cohort_date = f"{date_info['year']}-W{date_info['week']:02d}"
                else:
                    cohort_date = f"{date_info['year']}-{date_info['month']:02d}"
                
                # Calculate retention metrics (simplified)
                # Count users who have multiple sessions
                multi_session_users = 0
                converted_users = 0
                
                for user_id in user_ids:
                    session_count = await sessions_collection.count_documents({"user_id": user_id})
                    if session_count > 1:
                        multi_session_users += 1
                    
                    # Check if user converted
                    converted_session = await sessions_collection.find_one({
                        "user_id": user_id,
                        "conversion_completed": True
                    })
                    if converted_session:
                        converted_users += 1
                
                retention_rate = (multi_session_users / max(1, cohort_size)) * 100
                conversion_rate = (converted_users / max(1, cohort_size)) * 100
                
                cohorts.append({
                    'cohort_date': cohort_date,
                    'cohort_type': cohort_type,
                    'cohort_size': cohort_size,
                    'retained_users': multi_session_users,
                    'converted_users': converted_users,
                    'retention_rate': round(retention_rate, 2),
                    'conversion_rate': round(conversion_rate, 2)
                })
            
            return cohorts
            
        except Exception as e:
            logger.error(f"Error getting cohort analysis: {e}")
            raise
    
    async def refresh_analytics(self, db: MongoDB):
        """Refresh all analytics calculations"""
        try:
            logger.info("Starting analytics refresh...")
            
            # Clear existing analytics
            analytics_collection = db.get_collection("funnel_analytics")
            await analytics_collection.delete_many({})
            
            # Recalculate funnel analytics for different segments
            devices = ["Desktop", "Mobile"]
            
            for device in devices:
                # Get funnel analysis for this device
                funnel_analysis = await self.get_funnel_analysis(db, device_type=device)
                
                if funnel_analysis:
                    device_analysis = funnel_analysis[0]  # Should be only one for specific device
                    
                    # Store analytics for each step
                    for step in device_analysis.steps:
                        analytics_doc = {
                            'date': datetime.utcnow(),
                            'device_type': device,
                            'funnel_step': step.step,
                            'total_users': step.total_users,
                            'converted_users': step.total_users,  # Simplified
                            'conversion_rate': step.conversion_rate,
                            'drop_off_rate': step.drop_off_rate,
                            'avg_time_spent': step.avg_time_spent,
                            'created_at': datetime.utcnow()
                        }
                        
                        await analytics_collection.insert_one(analytics_doc)
            
            logger.info("Analytics refresh completed successfully")
            
        except Exception as e:
            logger.error(f"Error refreshing analytics: {e}")
            raise