import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
import numpy as np
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

    async def connect_to_mongo(self):
        """Create database connection"""
        self.client = AsyncIOMotorClient(
            os.getenv("MONGODB_URL", "mongodb://admin:password123@localhost:27017/funnel_analysis?authSource=admin")
        )
        self.database = self.client[os.getenv("DB_NAME", "funnel_analysis")]
        logger.info("Connected to MongoDB")

    async def close_mongo_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    def get_collection(self, collection_name: str):
        """Get collection by name"""
        return self.database[collection_name]


class MilvusDB:
    def __init__(self):
        self.host = os.getenv("MILVUS_HOST", "localhost")
        self.port = os.getenv("MILVUS_PORT", "19530")
        self.connected = False

    async def connect(self):
        """Connect to Milvus"""
        try:
            connections.connect(
                alias="default",
                host=self.host,
                port=self.port
            )
            self.connected = True
            logger.info("Connected to Milvus")
            
            # Create collections if they don't exist
            await self._create_collections()
            
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}")
            raise

    async def _create_collections(self):
        """Create Milvus collections for vector storage"""
        
        # User behavior embedding collection
        user_behavior_fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="user_id", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=128),
            FieldSchema(name="timestamp", dtype=DataType.INT64),
            FieldSchema(name="device_type", dtype=DataType.VARCHAR, max_length=50),
        ]
        
        user_behavior_schema = CollectionSchema(
            fields=user_behavior_fields,
            description="User behavior embeddings for Two Tower model"
        )
        
        if not utility.has_collection("user_behavior_embeddings"):
            user_behavior_collection = Collection(
                name="user_behavior_embeddings",
                schema=user_behavior_schema
            )
            # Create index
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 1024}
            }
            user_behavior_collection.create_index(
                field_name="embedding",
                index_params=index_params
            )
            logger.info("Created user_behavior_embeddings collection")

        # Page interaction embedding collection
        page_interaction_fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="page", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=128),
            FieldSchema(name="interaction_type", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="timestamp", dtype=DataType.INT64),
        ]
        
        page_interaction_schema = CollectionSchema(
            fields=page_interaction_fields,
            description="Page interaction embeddings for Two Tower model"
        )
        
        if not utility.has_collection("page_interaction_embeddings"):
            page_interaction_collection = Collection(
                name="page_interaction_embeddings",
                schema=page_interaction_schema
            )
            # Create index
            page_interaction_collection.create_index(
                field_name="embedding",
                index_params=index_params
            )
            logger.info("Created page_interaction_embeddings collection")

    async def insert_user_embedding(
        self,
        user_id: str,
        embedding: List[float],
        device_type: str,
        timestamp: Optional[datetime] = None
    ):
        """Insert user behavior embedding"""
        if not self.connected:
            raise RuntimeError("Not connected to Milvus")
            
        collection = Collection("user_behavior_embeddings")
        
        if timestamp is None:
            timestamp = datetime.utcnow()
            
        data = [
            [user_id],
            [embedding],
            [int(timestamp.timestamp())],
            [device_type]
        ]
        
        collection.insert(data)
        collection.flush()

    async def insert_page_embedding(
        self,
        page: str,
        embedding: List[float],
        interaction_type: str,
        timestamp: Optional[datetime] = None
    ):
        """Insert page interaction embedding"""
        if not self.connected:
            raise RuntimeError("Not connected to Milvus")
            
        collection = Collection("page_interaction_embeddings")
        
        if timestamp is None:
            timestamp = datetime.utcnow()
            
        data = [
            [page],
            [embedding],
            [interaction_type],
            [int(timestamp.timestamp())]
        ]
        
        collection.insert(data)
        collection.flush()

    async def search_similar_users(
        self,
        query_embedding: List[float],
        limit: int = 10,
        device_filter: Optional[str] = None
    ):
        """Search for similar user behavior embeddings"""
        if not self.connected:
            raise RuntimeError("Not connected to Milvus")
            
        collection = Collection("user_behavior_embeddings")
        collection.load()
        
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        expr = None
        if device_filter:
            expr = f'device_type == "{device_filter}"'
        
        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit,
            expr=expr,
            output_fields=["user_id", "device_type", "timestamp"]
        )
        
        return results[0] if results else []

    def disconnect(self):
        """Disconnect from Milvus"""
        if self.connected:
            connections.disconnect("default")
            self.connected = False
            logger.info("Disconnected from Milvus")


# Global database instances
mongodb = MongoDB()
milvusdb = MilvusDB()


async def get_database():
    """Dependency for getting database instance"""
    return mongodb


async def get_milvus():
    """Dependency for getting Milvus instance"""
    return milvusdb


# Database initialization
async def init_database():
    """Initialize database connections"""
    await mongodb.connect_to_mongo()
    await milvusdb.connect()
    
    # Create indexes for MongoDB collections
    try:
        # User collection indexes
        users_collection = mongodb.get_collection("users")
        await users_collection.create_index("user_id", unique=True)
        await users_collection.create_index([("date", 1), ("device", 1)])
        
        # Page visits collection indexes
        page_visits_collection = mongodb.get_collection("page_visits")
        await page_visits_collection.create_index([("user_id", 1), ("timestamp", -1)])
        await page_visits_collection.create_index("page")
        
        # User interactions collection indexes
        interactions_collection = mongodb.get_collection("user_interactions")
        await interactions_collection.create_index([("user_id", 1), ("timestamp", -1)])
        await interactions_collection.create_index([("page", 1), ("interaction_type", 1)])
        
        # User sessions collection indexes
        sessions_collection = mongodb.get_collection("user_sessions")
        await sessions_collection.create_index("session_id", unique=True)
        await sessions_collection.create_index([("user_id", 1), ("start_time", -1)])
        
        # Funnel analytics collection indexes
        funnel_collection = mongodb.get_collection("funnel_analytics")
        await funnel_collection.create_index([("date", -1), ("device_type", 1)])
        await funnel_collection.create_index("funnel_step")
        
        # Sentiment analysis collection indexes
        sentiment_collection = mongodb.get_collection("sentiment_analysis")
        await sentiment_collection.create_index([("user_id", 1), ("timestamp", -1)])
        await sentiment_collection.create_index("page")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")


async def close_database():
    """Close database connections"""
    await mongodb.close_mongo_connection()
    milvusdb.disconnect()