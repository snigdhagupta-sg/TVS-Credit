import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model, optimizers, losses, metrics
from sklearn.preprocessing import LabelEncoder, StandardScaler
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from database import MongoDB, MilvusDB
import asyncio
from collections import defaultdict
import json

logger = logging.getLogger(__name__)


class TwoTowerModel:
    def __init__(self, embedding_dim: int = 128, hidden_dims: List[int] = [256, 128]):
        self.embedding_dim = embedding_dim
        self.hidden_dims = hidden_dims
        self.model = None
        self.user_encoder = None
        self.page_encoder = None
        self.device_encoder = LabelEncoder()
        self.interaction_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def _build_user_tower(self, num_users: int, num_devices: int) -> Model:
        """Build user tower for user embeddings"""
        # User inputs
        user_id_input = layers.Input(shape=(), name='user_id')
        device_input = layers.Input(shape=(), name='device')
        session_count_input = layers.Input(shape=(), name='session_count')
        interaction_count_input = layers.Input(shape=(), name='interaction_count')
        avg_time_input = layers.Input(shape=(), name='avg_time')
        
        # User embeddings
        user_embedding = layers.Embedding(
            num_users, 64, name='user_embedding'
        )(user_id_input)
        user_embedding = layers.Flatten()(user_embedding)
        
        device_embedding = layers.Embedding(
            num_devices, 16, name='device_embedding'
        )(device_input)
        device_embedding = layers.Flatten()(device_embedding)
        
        # Concatenate all user features
        user_features = layers.Concatenate()([
            user_embedding,
            device_embedding,
            layers.Reshape((1,))(session_count_input),
            layers.Reshape((1,))(interaction_count_input),
            layers.Reshape((1,))(avg_time_input)
        ])
        
        # User tower layers
        x = user_features
        for dim in self.hidden_dims:
            x = layers.Dense(dim, activation='relu')(x)
            x = layers.BatchNormalization()(x)
            x = layers.Dropout(0.2)(x)
        
        user_output = layers.Dense(self.embedding_dim, activation='tanh', name='user_tower')(x)
        
        return Model(
            inputs=[user_id_input, device_input, session_count_input, 
                   interaction_count_input, avg_time_input],
            outputs=user_output,
            name='user_tower'
        )
    
    def _build_page_tower(self, num_pages: int, num_interactions: int) -> Model:
        """Build page tower for page interaction embeddings"""
        # Page inputs
        page_input = layers.Input(shape=(), name='page')
        interaction_type_input = layers.Input(shape=(), name='interaction_type')
        click_rate_input = layers.Input(shape=(), name='click_rate')
        time_spent_input = layers.Input(shape=(), name='time_spent')
        conversion_rate_input = layers.Input(shape=(), name='conversion_rate')
        
        # Page embeddings
        page_embedding = layers.Embedding(
            num_pages, 64, name='page_embedding'
        )(page_input)
        page_embedding = layers.Flatten()(page_embedding)
        
        interaction_embedding = layers.Embedding(
            num_interactions, 32, name='interaction_embedding'
        )(interaction_type_input)
        interaction_embedding = layers.Flatten()(interaction_embedding)
        
        # Concatenate all page features
        page_features = layers.Concatenate()([
            page_embedding,
            interaction_embedding,
            layers.Reshape((1,))(click_rate_input),
            layers.Reshape((1,))(time_spent_input),
            layers.Reshape((1,))(conversion_rate_input)
        ])
        
        # Page tower layers
        x = page_features
        for dim in self.hidden_dims:
            x = layers.Dense(dim, activation='relu')(x)
            x = layers.BatchNormalization()(x)
            x = layers.Dropout(0.2)(x)
        
        page_output = layers.Dense(self.embedding_dim, activation='tanh', name='page_tower')(x)
        
        return Model(
            inputs=[page_input, interaction_type_input, click_rate_input,
                   time_spent_input, conversion_rate_input],
            outputs=page_output,
            name='page_tower'
        )
    
    def _build_two_tower_model(self, user_tower: Model, page_tower: Model) -> Model:
        """Build complete Two Tower model"""
        # User tower inputs
        user_inputs = user_tower.inputs
        user_embedding = user_tower(user_inputs)
        
        # Page tower inputs  
        page_inputs = page_tower.inputs
        page_embedding = page_tower(page_inputs)
        
        # Compute similarity (dot product)
        similarity = layers.Dot(axes=1, normalize=True)([user_embedding, page_embedding])
        
        # Output probability
        output = layers.Dense(1, activation='sigmoid', name='interaction_probability')(similarity)
        
        return Model(
            inputs=user_inputs + page_inputs,
            outputs=output,
            name='two_tower_model'
        )
    
    async def prepare_training_data(self, db: MongoDB) -> Tuple[Dict, Dict, np.ndarray]:
        """Prepare training data from database"""
        logger.info("Preparing training data...")
        
        # Get user data
        users_collection = db.get_collection("users")
        users_data = []
        async for user in users_collection.find():
            users_data.append(user)
        
        # Get page visits data
        visits_collection = db.get_collection("page_visits")
        visits_data = []
        async for visit in visits_collection.find():
            visits_data.append(visit)
        
        # Get user interactions data
        interactions_collection = db.get_collection("user_interactions")
        interactions_data = []
        async for interaction in interactions_collection.find():
            interactions_data.append(interaction)
        
        # Create user features
        user_stats = defaultdict(lambda: {
            'session_count': 0, 'interaction_count': 0, 'total_time': 0, 'device': 'Desktop'
        })
        
        for user in users_data:
            user_id = user['user_id']
            user_stats[user_id]['device'] = user['device']
        
        for visit in visits_data:
            user_id = visit['user_id']
            user_stats[user_id]['session_count'] += 1
            if 'duration' in visit and visit['duration']:
                user_stats[user_id]['total_time'] += visit['duration']
        
        for interaction in interactions_data:
            user_id = interaction['user_id']
            user_stats[user_id]['interaction_count'] += 1
        
        # Create page features
        page_stats = defaultdict(lambda: {
            'click_count': 0, 'total_time': 0, 'visit_count': 0, 'conversions': 0
        })
        
        for visit in visits_data:
            page = visit['page']
            page_stats[page]['visit_count'] += 1
            if 'duration' in visit and visit['duration']:
                page_stats[page]['total_time'] += visit['duration']
        
        for interaction in interactions_data:
            page = interaction['page']
            if interaction['interaction_type'] == 'click':
                page_stats[page]['click_count'] += 1
        
        # Create training examples
        training_examples = []
        
        # Positive examples (actual interactions)
        for interaction in interactions_data:
            user_id = interaction['user_id']
            page = interaction['page']
            interaction_type = interaction['interaction_type']
            
            if user_id in user_stats:
                user_data = user_stats[user_id]
                page_data = page_stats[page]
                
                example = {
                    'user_id': user_id,
                    'device': user_data['device'],
                    'session_count': user_data['session_count'],
                    'interaction_count': user_data['interaction_count'],
                    'avg_time': user_data['total_time'] / max(1, user_data['session_count']),
                    'page': page,
                    'interaction_type': interaction_type,
                    'click_rate': page_data['click_count'] / max(1, page_data['visit_count']),
                    'time_spent': page_data['total_time'] / max(1, page_data['visit_count']),
                    'conversion_rate': page_data['conversions'] / max(1, page_data['visit_count']),
                    'label': 1
                }
                training_examples.append(example)
        
        # Negative examples (random user-page pairs without interactions)
        users_list = list(user_stats.keys())
        pages_list = list(page_stats.keys())
        
        # Create set of actual interactions for filtering
        actual_interactions = set()
        for interaction in interactions_data:
            actual_interactions.add((interaction['user_id'], interaction['page']))
        
        # Generate negative samples
        negative_count = len(training_examples)
        for _ in range(negative_count):
            user_id = np.random.choice(users_list)
            page = np.random.choice(pages_list)
            
            if (user_id, page) not in actual_interactions:
                user_data = user_stats[user_id]
                page_data = page_stats[page]
                
                example = {
                    'user_id': user_id,
                    'device': user_data['device'],
                    'session_count': user_data['session_count'],
                    'interaction_count': user_data['interaction_count'],
                    'avg_time': user_data['total_time'] / max(1, user_data['session_count']),
                    'page': page,
                    'interaction_type': 'none',
                    'click_rate': page_data['click_count'] / max(1, page_data['visit_count']),
                    'time_spent': page_data['total_time'] / max(1, page_data['visit_count']),
                    'conversion_rate': page_data['conversions'] / max(1, page_data['visit_count']),
                    'label': 0
                }
                training_examples.append(example)
        
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(training_examples)
        
        # Encode categorical features
        self.user_encoder = LabelEncoder()
        self.page_encoder = LabelEncoder()
        
        df['user_id_encoded'] = self.user_encoder.fit_transform(df['user_id'])
        df['page_encoded'] = self.page_encoder.fit_transform(df['page'])
        df['device_encoded'] = self.device_encoder.fit_transform(df['device'])
        df['interaction_type_encoded'] = self.interaction_encoder.fit_transform(df['interaction_type'])
        
        # Normalize numerical features
        numerical_features = ['session_count', 'interaction_count', 'avg_time', 
                             'click_rate', 'time_spent', 'conversion_rate']
        df[numerical_features] = self.scaler.fit_transform(df[numerical_features])
        
        # Prepare features
        user_features = {
            'user_id': df['user_id_encoded'].values,
            'device': df['device_encoded'].values,
            'session_count': df['session_count'].values,
            'interaction_count': df['interaction_count'].values,
            'avg_time': df['avg_time'].values
        }
        
        page_features = {
            'page': df['page_encoded'].values,
            'interaction_type': df['interaction_type_encoded'].values,
            'click_rate': df['click_rate'].values,
            'time_spent': df['time_spent'].values,
            'conversion_rate': df['conversion_rate'].values
        }
        
        labels = df['label'].values
        
        logger.info(f"Prepared {len(training_examples)} training examples")
        return user_features, page_features, labels
    
    async def train_model(self, db: MongoDB, epochs: int = 50, batch_size: int = 256):
        """Train the Two Tower model"""
        logger.info("Starting Two Tower model training...")
        
        # Prepare data
        user_features, page_features, labels = await self.prepare_training_data(db)
        
        # Get vocabulary sizes
        num_users = len(self.user_encoder.classes_)
        num_pages = len(self.page_encoder.classes_)
        num_devices = len(self.device_encoder.classes_)
        num_interactions = len(self.interaction_encoder.classes_)
        
        logger.info(f"Vocabulary sizes - Users: {num_users}, Pages: {num_pages}, "
                   f"Devices: {num_devices}, Interactions: {num_interactions}")
        
        # Build model
        user_tower = self._build_user_tower(num_users, num_devices)
        page_tower = self._build_page_tower(num_pages, num_interactions)
        self.model = self._build_two_tower_model(user_tower, page_tower)
        
        # Compile model
        self.model.compile(
            optimizer=optimizers.Adam(learning_rate=0.001),
            loss=losses.BinaryCrossentropy(),
            metrics=[metrics.BinaryAccuracy(), metrics.AUC()]
        )
        
        # Prepare training inputs
        train_inputs = [
            user_features['user_id'],
            user_features['device'],
            user_features['session_count'],
            user_features['interaction_count'],
            user_features['avg_time'],
            page_features['page'],
            page_features['interaction_type'],
            page_features['click_rate'],
            page_features['time_spent'],
            page_features['conversion_rate']
        ]
        
        # Train model
        history = self.model.fit(
            train_inputs,
            labels,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )
        
        self.is_trained = True
        logger.info("Model training completed successfully")
        
        return history
    
    def get_user_embedding(self, user_features: Dict) -> np.ndarray:
        """Get user embedding from trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        user_tower = self.model.get_layer('user_tower')
        
        # Prepare inputs
        user_inputs = [
            np.array([user_features['user_id']]),
            np.array([user_features['device']]),
            np.array([user_features['session_count']]),
            np.array([user_features['interaction_count']]),
            np.array([user_features['avg_time']])
        ]
        
        embedding = user_tower.predict(user_inputs)
        return embedding[0]
    
    def get_page_embedding(self, page_features: Dict) -> np.ndarray:
        """Get page embedding from trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        page_tower = self.model.get_layer('page_tower')
        
        # Prepare inputs
        page_inputs = [
            np.array([page_features['page']]),
            np.array([page_features['interaction_type']]),
            np.array([page_features['click_rate']]),
            np.array([page_features['time_spent']]),
            np.array([page_features['conversion_rate']])
        ]
        
        embedding = page_tower.predict(page_inputs)
        return embedding[0]
    
    async def find_similar_users(
        self, 
        db: MongoDB, 
        milvus: MilvusDB, 
        target_user_id: str,
        limit: int = 10,
        device_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Find similar users using vector similarity in Milvus"""
        try:
            # Get target user data
            users_collection = db.get_collection("users")
            target_user = await users_collection.find_one({"user_id": target_user_id})
            
            if not target_user:
                return []
            
            # Get user stats for target user
            user_stats = await self._get_user_stats(db, target_user_id)
            
            # Encode user features
            if target_user_id in self.user_encoder.classes_:
                user_id_encoded = self.user_encoder.transform([target_user_id])[0]
            else:
                return []  # User not in training data
            
            device_encoded = self.device_encoder.transform([target_user['device']])[0]
            
            # Normalize numerical features
            numerical_features = np.array([[
                user_stats['session_count'],
                user_stats['interaction_count'], 
                user_stats['avg_time']
            ]])
            normalized_features = self.scaler.transform(numerical_features)[0]
            
            # Get user embedding
            user_features = {
                'user_id': user_id_encoded,
                'device': device_encoded,
                'session_count': normalized_features[0],
                'interaction_count': normalized_features[1],
                'avg_time': normalized_features[2]
            }
            
            target_embedding = self.get_user_embedding(user_features)
            
            # Search for similar users in Milvus
            similar_results = await milvus.search_similar_users(
                target_embedding.tolist(),
                limit + 1,  # +1 to exclude target user
                device_filter
            )
            
            # Process results
            similar_users = []
            for result in similar_results:
                if result.entity.get('user_id') != target_user_id:
                    user_data = await users_collection.find_one({
                        "user_id": result.entity.get('user_id')
                    })
                    
                    if user_data:
                        similar_users.append({
                            'user_id': result.entity.get('user_id'),
                            'device': user_data['device'],
                            'similarity_score': float(result.distance),
                            'timestamp': result.entity.get('timestamp')
                        })
            
            return similar_users[:limit]
            
        except Exception as e:
            logger.error(f"Error finding similar users: {e}")
            return []
    
    async def _get_user_stats(self, db: MongoDB, user_id: str) -> Dict[str, float]:
        """Get user statistics for feature calculation"""
        # Get sessions count
        sessions_collection = db.get_collection("user_sessions")
        session_count = await sessions_collection.count_documents({"user_id": user_id})
        
        # Get interactions count
        interactions_collection = db.get_collection("user_interactions")
        interaction_count = await interactions_collection.count_documents({"user_id": user_id})
        
        # Get average time spent
        sessions = []
        async for session in sessions_collection.find({"user_id": user_id}):
            if session.get('end_time') and session.get('start_time'):
                duration = (session['end_time'] - session['start_time']).total_seconds()
                sessions.append(duration)
        
        avg_time = np.mean(sessions) if sessions else 0.0
        
        return {
            'session_count': float(session_count),
            'interaction_count': float(interaction_count),
            'avg_time': avg_time
        }
    
    async def update_embeddings(self, db: MongoDB, milvus: MilvusDB):
        """Update embeddings in Milvus database"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        logger.info("Updating embeddings in Milvus...")
        
        # Get all users
        users_collection = db.get_collection("users")
        user_embeddings = []
        
        async for user in users_collection.find():
            user_id = user['user_id']
            
            if user_id in self.user_encoder.classes_:
                user_stats = await self._get_user_stats(db, user_id)
                
                # Encode features
                user_id_encoded = self.user_encoder.transform([user_id])[0]
                device_encoded = self.device_encoder.transform([user['device']])[0]
                
                # Normalize numerical features
                numerical_features = np.array([[
                    user_stats['session_count'],
                    user_stats['interaction_count'],
                    user_stats['avg_time']
                ]])
                normalized_features = self.scaler.transform(numerical_features)[0]
                
                # Get embedding
                user_features = {
                    'user_id': user_id_encoded,
                    'device': device_encoded,
                    'session_count': normalized_features[0],
                    'interaction_count': normalized_features[1],
                    'avg_time': normalized_features[2]
                }
                
                embedding = self.get_user_embedding(user_features)
                
                # Store in Milvus
                await milvus.insert_user_embedding(
                    user_id,
                    embedding.tolist(),
                    user['device']
                )
        
        logger.info("Embeddings updated successfully")
    
    async def retrain_model(self, db: MongoDB, milvus: MilvusDB):
        """Retrain model and update embeddings"""
        logger.info("Starting model retraining process...")
        
        # Train model
        await self.train_model(db)
        
        # Update embeddings
        await self.update_embeddings(db, milvus)
        
        logger.info("Model retraining completed successfully")