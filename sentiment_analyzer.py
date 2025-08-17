import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from collections import defaultdict, Counter
from database import MongoDB
import asyncio
import re

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    def __init__(self):
        self.sentiment_pipeline = None
        self.interaction_patterns = {
            'frustrated': ['back', 'multiple_clicks', 'rapid_scrolling', 'long_pause'],
            'engaged': ['click', 'scroll', 'hover', 'form_fill'],
            'confused': ['back_forth', 'multiple_pages', 'no_interaction'],
            'satisfied': ['purchase', 'form_submit', 'long_session']
        }
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained sentiment analysis model"""
        try:
            # Use a lightweight sentiment analysis model
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                tokenizer="cardiffnlp/twitter-roberta-base-sentiment-latest",
                return_all_scores=True
            )
            logger.info("Sentiment analysis model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load transformer model: {e}. Using rule-based fallback.")
            self.sentiment_pipeline = None
    
    def analyze_interaction_patterns(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user interaction patterns to infer sentiment"""
        if not interactions:
            return {'sentiment_score': 0.0, 'confidence': 0.0, 'patterns': []}
        
        # Sort interactions by timestamp
        sorted_interactions = sorted(interactions, key=lambda x: x.get('timestamp', datetime.min))
        
        pattern_scores = defaultdict(int)
        detected_patterns = []
        
        # Analyze interaction sequence
        for i, interaction in enumerate(sorted_interactions):
            interaction_type = interaction.get('interaction_type', '').lower()
            
            # Check for frustrated patterns
            if interaction_type == 'back':
                pattern_scores['frustrated'] += 2
                detected_patterns.append('back_press')
            
            # Multiple rapid clicks (frustrated)
            if i > 0:
                time_diff = (interaction['timestamp'] - sorted_interactions[i-1]['timestamp']).total_seconds()
                if time_diff < 2 and interaction_type == 'click':
                    pattern_scores['frustrated'] += 1
                    detected_patterns.append('rapid_clicking')
            
            # Check for engaged patterns
            if interaction_type in ['click', 'scroll', 'hover']:
                pattern_scores['engaged'] += 1
            
            if interaction_type == 'form_fill':
                pattern_scores['engaged'] += 2
                detected_patterns.append('form_interaction')
            
            # Check for satisfied patterns
            if interaction_type in ['purchase', 'form_submit']:
                pattern_scores['satisfied'] += 3
                detected_patterns.append('conversion_action')
            
            # Long pauses might indicate confusion
            if i > 0:
                time_diff = (interaction['timestamp'] - sorted_interactions[i-1]['timestamp']).total_seconds()
                if time_diff > 30:  # 30+ seconds pause
                    pattern_scores['confused'] += 1
                    detected_patterns.append('long_pause')
        
        # Calculate overall sentiment score
        total_positive = pattern_scores['engaged'] + pattern_scores['satisfied']
        total_negative = pattern_scores['frustrated'] + pattern_scores['confused']
        
        if total_positive + total_negative == 0:
            sentiment_score = 0.0
            confidence = 0.0
        else:
            sentiment_score = (total_positive - total_negative) / (total_positive + total_negative)
            confidence = min(1.0, (total_positive + total_negative) / len(interactions))
        
        return {
            'sentiment_score': sentiment_score,
            'confidence': confidence,
            'patterns': list(set(detected_patterns)),
            'pattern_scores': dict(pattern_scores)
        }
    
    def analyze_page_sentiment(self, page_interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze sentiment for a specific page based on all user interactions"""
        if not page_interactions:
            return {
                'overall_sentiment': 0.0,
                'sentiment_distribution': {'positive': 0, 'neutral': 0, 'negative': 0},
                'avg_confidence': 0.0,
                'total_interactions': 0
            }
        
        user_sentiments = {}
        
        # Group interactions by user
        user_interactions = defaultdict(list)
        for interaction in page_interactions:
            user_id = interaction.get('user_id')
            if user_id:
                user_interactions[user_id].append(interaction)
        
        # Analyze sentiment for each user
        sentiment_scores = []
        confidence_scores = []
        sentiment_labels = []
        
        for user_id, interactions in user_interactions.items():
            analysis = self.analyze_interaction_patterns(interactions)
            sentiment_score = analysis['sentiment_score']
            confidence = analysis['confidence']
            
            sentiment_scores.append(sentiment_score)
            confidence_scores.append(confidence)
            
            # Convert score to label
            if sentiment_score > 0.1:
                label = 'positive'
            elif sentiment_score < -0.1:
                label = 'negative'
            else:
                label = 'neutral'
            
            sentiment_labels.append(label)
            user_sentiments[user_id] = {
                'score': sentiment_score,
                'label': label,
                'confidence': confidence,
                'patterns': analysis['patterns']
            }
        
        # Calculate overall metrics
        overall_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0.0
        avg_confidence = np.mean(confidence_scores) if confidence_scores else 0.0
        
        sentiment_distribution = Counter(sentiment_labels)
        
        return {
            'overall_sentiment': overall_sentiment,
            'sentiment_distribution': dict(sentiment_distribution),
            'avg_confidence': avg_confidence,
            'total_interactions': len(page_interactions),
            'user_sentiments': user_sentiments
        }
    
    async def analyze_user_sentiment(self, db: MongoDB, user_id: str) -> Dict[str, Any]:
        """Analyze sentiment for a specific user across all their interactions"""
        try:
            # Get user interactions
            interactions_collection = db.get_collection("user_interactions")
            interactions = []
            
            async for interaction in interactions_collection.find({"user_id": user_id}):
                interactions.append(interaction)
            
            if not interactions:
                return {
                    'user_id': user_id,
                    'sentiment_score': 0.0,
                    'sentiment_label': 'neutral',
                    'confidence': 0.0,
                    'patterns': [],
                    'page_sentiments': {}
                }
            
            # Overall user sentiment
            overall_analysis = self.analyze_interaction_patterns(interactions)
            
            # Per-page sentiment analysis
            page_interactions = defaultdict(list)
            for interaction in interactions:
                page = interaction.get('page')
                if page:
                    page_interactions[page].append(interaction)
            
            page_sentiments = {}
            for page, page_ints in page_interactions.items():
                page_analysis = self.analyze_interaction_patterns(page_ints)
                page_sentiments[page] = {
                    'sentiment_score': page_analysis['sentiment_score'],
                    'confidence': page_analysis['confidence'],
                    'patterns': page_analysis['patterns']
                }
            
            # Convert score to label
            sentiment_score = overall_analysis['sentiment_score']
            if sentiment_score > 0.1:
                sentiment_label = 'positive'
            elif sentiment_score < -0.1:
                sentiment_label = 'negative'
            else:
                sentiment_label = 'neutral'
            
            return {
                'user_id': user_id,
                'sentiment_score': sentiment_score,
                'sentiment_label': sentiment_label,
                'confidence': overall_analysis['confidence'],
                'patterns': overall_analysis['patterns'],
                'page_sentiments': page_sentiments
            }
            
        except Exception as e:
            logger.error(f"Error analyzing user sentiment for {user_id}: {e}")
            return {
                'user_id': user_id,
                'sentiment_score': 0.0,
                'sentiment_label': 'neutral',
                'confidence': 0.0,
                'patterns': [],
                'page_sentiments': {}
            }
    
    async def get_sentiment_analysis(
        self, 
        db: MongoDB, 
        page: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get sentiment analysis results with optional filtering"""
        try:
            # Build query
            query = {}
            if page:
                query['page'] = page
            if start_date or end_date:
                query['timestamp'] = {}
                if start_date:
                    query['timestamp']['$gte'] = start_date
                if end_date:
                    query['timestamp']['$lte'] = end_date
            
            # Get interactions
            interactions_collection = db.get_collection("user_interactions")
            interactions = []
            
            async for interaction in interactions_collection.find(query):
                interactions.append(interaction)
            
            if not interactions:
                return []
            
            # Group by page if no specific page requested
            if not page:
                page_groups = defaultdict(list)
                for interaction in interactions:
                    page_name = interaction.get('page', 'unknown')
                    page_groups[page_name].append(interaction)
                
                results = []
                for page_name, page_interactions in page_groups.items():
                    page_sentiment = self.analyze_page_sentiment(page_interactions)
                    page_sentiment['page'] = page_name
                    results.append(page_sentiment)
                
                return results
            else:
                # Single page analysis
                page_sentiment = self.analyze_page_sentiment(interactions)
                page_sentiment['page'] = page
                return [page_sentiment]
            
        except Exception as e:
            logger.error(f"Error getting sentiment analysis: {e}")
            return []
    
    async def calculate_sentiment_trends(
        self,
        db: MongoDB,
        period: str = 'daily',
        page: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Calculate sentiment trends over time"""
        try:
            # Build aggregation pipeline
            match_stage = {}
            if page:
                match_stage['page'] = page
            if start_date or end_date:
                match_stage['timestamp'] = {}
                if start_date:
                    match_stage['timestamp']['$gte'] = start_date
                if end_date:
                    match_stage['timestamp']['$lte'] = end_date
            
            # Group by time period
            if period == 'daily':
                date_group = {
                    'year': {'$year': '$timestamp'},
                    'month': {'$month': '$timestamp'},
                    'day': {'$dayOfMonth': '$timestamp'}
                }
            elif period == 'weekly':
                date_group = {
                    'year': {'$year': '$timestamp'},
                    'week': {'$week': '$timestamp'}
                }
            else:  # monthly
                date_group = {
                    'year': {'$year': '$timestamp'},
                    'month': {'$month': '$timestamp'}
                }
            
            pipeline = [
                {'$match': match_stage},
                {'$group': {
                    '_id': date_group,
                    'interactions': {'$push': '$$ROOT'},
                    'count': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            
            interactions_collection = db.get_collection("user_interactions")
            cursor = interactions_collection.aggregate(pipeline)
            
            trends = []
            async for group in cursor:
                interactions = group['interactions']
                
                # Analyze sentiment for this time period
                sentiment_analysis = self.analyze_page_sentiment(interactions)
                
                # Create date string
                date_info = group['_id']
                if period == 'daily':
                    date_str = f"{date_info['year']}-{date_info['month']:02d}-{date_info['day']:02d}"
                elif period == 'weekly':
                    date_str = f"{date_info['year']}-W{date_info['week']:02d}"
                else:
                    date_str = f"{date_info['year']}-{date_info['month']:02d}"
                
                trends.append({
                    'date': date_str,
                    'period': period,
                    'sentiment_score': sentiment_analysis['overall_sentiment'],
                    'sentiment_distribution': sentiment_analysis['sentiment_distribution'],
                    'confidence': sentiment_analysis['avg_confidence'],
                    'interaction_count': group['count']
                })
            
            return trends
            
        except Exception as e:
            logger.error(f"Error calculating sentiment trends: {e}")
            return []
    
    async def store_sentiment_analysis(self, db: MongoDB, user_id: str, analysis: Dict[str, Any]):
        """Store sentiment analysis results in database"""
        try:
            sentiment_collection = db.get_collection("sentiment_analysis")
            
            sentiment_doc = {
                'user_id': user_id,
                'page': analysis.get('page', 'overall'),
                'sentiment_score': analysis['sentiment_score'],
                'sentiment_label': analysis['sentiment_label'],
                'confidence': analysis['confidence'],
                'interaction_patterns': analysis.get('patterns', []),
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
            
            await sentiment_collection.insert_one(sentiment_doc)
            logger.info(f"Stored sentiment analysis for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error storing sentiment analysis: {e}")
    
    async def batch_analyze_sentiment(self, db: MongoDB, limit: int = 1000):
        """Batch analyze sentiment for users who don't have recent analysis"""
        try:
            logger.info("Starting batch sentiment analysis...")
            
            # Get users who need sentiment analysis
            users_collection = db.get_collection("users")
            sentiment_collection = db.get_collection("sentiment_analysis")
            
            # Find users without recent sentiment analysis
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            
            users_to_analyze = []
            async for user in users_collection.find().limit(limit):
                user_id = user['user_id']
                
                # Check if user has recent sentiment analysis
                recent_analysis = await sentiment_collection.find_one({
                    'user_id': user_id,
                    'timestamp': {'$gte': cutoff_date}
                })
                
                if not recent_analysis:
                    users_to_analyze.append(user_id)
            
            logger.info(f"Found {len(users_to_analyze)} users needing sentiment analysis")
            
            # Analyze sentiment for each user
            analyzed_count = 0
            for user_id in users_to_analyze:
                try:
                    analysis = await self.analyze_user_sentiment(db, user_id)
                    await self.store_sentiment_analysis(db, user_id, analysis)
                    analyzed_count += 1
                    
                    if analyzed_count % 100 == 0:
                        logger.info(f"Analyzed sentiment for {analyzed_count} users")
                        
                except Exception as e:
                    logger.error(f"Error analyzing sentiment for user {user_id}: {e}")
                    continue
            
            logger.info(f"Completed batch sentiment analysis for {analyzed_count} users")
            return analyzed_count
            
        except Exception as e:
            logger.error(f"Error in batch sentiment analysis: {e}")
            return 0