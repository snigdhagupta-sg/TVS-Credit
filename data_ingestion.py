import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import uuid
import random
from database import MongoDB, init_database
from models import User, PageVisit, UserInteraction, UserSession

logger = logging.getLogger(__name__)


class DataIngestionPipeline:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.mongodb = None
        
    async def initialize(self):
        """Initialize database connection"""
        await init_database()
        from database import mongodb
        self.mongodb = mongodb
        
    async def load_csv_data(self) -> Dict[str, pd.DataFrame]:
        """Load all CSV files into DataFrames"""
        logger.info("Loading CSV data files...")
        
        data_files = {
            'users': 'user_table.csv',
            'home_page': 'home_page_table.csv',
            'search_page': 'search_page_table.csv',
            'payment_page': 'payment_page_table.csv',
            'payment_confirmation': 'payment_confirmation_table.csv'
        }
        
        dataframes = {}
        
        for key, filename in data_files.items():
            file_path = self.data_dir / filename
            if file_path.exists():
                try:
                    df = pd.read_csv(file_path)
                    dataframes[key] = df
                    logger.info(f"Loaded {len(df)} records from {filename}")
                except Exception as e:
                    logger.error(f"Error loading {filename}: {e}")
            else:
                logger.warning(f"File {filename} not found")
        
        return dataframes
    
    def generate_synthetic_interactions(self, user_id: str, page: str, visit_timestamp: datetime) -> List[Dict[str, Any]]:
        """Generate synthetic user interactions for a page visit"""
        interactions = []
        
        # Define interaction patterns for different pages
        page_patterns = {
            'home_page': ['click', 'scroll', 'hover'],
            'search_page': ['click', 'scroll', 'form_fill', 'hover'],
            'payment_page': ['click', 'form_fill', 'hover', 'back'],
            'payment_confirmation_page': ['click', 'scroll']
        }
        
        # Define interaction elements for different pages
        page_elements = {
            'home_page': ['header', 'hero_section', 'product_grid', 'footer'],
            'search_page': ['search_bar', 'filter_options', 'product_list', 'pagination'],
            'payment_page': ['payment_form', 'card_details', 'billing_address', 'submit_button'],
            'payment_confirmation_page': ['order_summary', 'confirmation_message', 'continue_shopping']
        }
        
        # Determine number of interactions based on page
        if page == 'payment_confirmation_page':
            num_interactions = random.randint(1, 3)  # Fewer interactions on confirmation
        elif page == 'payment_page':
            num_interactions = random.randint(3, 8)  # More interactions on payment
        else:
            num_interactions = random.randint(2, 6)
        
        current_time = visit_timestamp
        session_id = str(uuid.uuid4())
        
        for i in range(num_interactions):
            # Select interaction type based on page patterns
            available_types = page_patterns.get(page, ['click', 'scroll'])
            interaction_type = random.choice(available_types)
            
            # Select element based on page
            available_elements = page_elements.get(page, ['unknown'])
            element_id = random.choice(available_elements)
            
            # Generate coordinates for click interactions
            coordinates = None
            if interaction_type == 'click':
                coordinates = {
                    'x': random.randint(100, 1200),
                    'y': random.randint(100, 800)
                }
            
            # Add some time between interactions
            current_time += timedelta(seconds=random.randint(1, 30))
            
            interaction = {
                'user_id': user_id,
                'page': page,
                'interaction_type': interaction_type,
                'element_id': element_id,
                'element_type': self._get_element_type(element_id),
                'coordinates': coordinates,
                'timestamp': current_time,
                'session_id': session_id,
                'metadata': {
                    'sequence_number': i + 1,
                    'total_interactions': num_interactions
                }
            }
            
            interactions.append(interaction)
        
        return interactions
    
    def _get_element_type(self, element_id: str) -> str:
        """Determine element type based on element ID"""
        if 'button' in element_id.lower() or 'submit' in element_id.lower():
            return 'button'
        elif 'form' in element_id.lower() or 'input' in element_id.lower():
            return 'form'
        elif 'link' in element_id.lower() or 'header' in element_id.lower():
            return 'link'
        else:
            return 'div'
    
    def generate_session_data(self, user_visits: List[Dict[str, Any]], user_interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate session data from visits and interactions"""
        if not user_visits:
            return None
        
        # Sort visits by timestamp
        sorted_visits = sorted(user_visits, key=lambda x: x['timestamp'])
        
        session_id = str(uuid.uuid4())
        start_time = sorted_visits[0]['timestamp']
        end_time = sorted_visits[-1]['timestamp']
        
        # Add some time for the last page
        end_time += timedelta(minutes=random.randint(1, 10))
        
        pages_visited = [visit['page'] for visit in sorted_visits]
        total_interactions = len(user_interactions)
        
        # Determine if conversion was completed
        conversion_completed = 'payment_confirmation_page' in pages_visited
        
        return {
            'session_id': session_id,
            'start_time': start_time,
            'end_time': end_time,
            'pages_visited': pages_visited,
            'total_interactions': total_interactions,
            'conversion_completed': conversion_completed
        }
    
    async def process_and_ingest_data(self, dataframes: Dict[str, pd.DataFrame]):
        """Process CSV data and ingest into MongoDB"""
        logger.info("Processing and ingesting data...")
        
        # Process users
        await self._ingest_users(dataframes['users'])
        
        # Process page visits and generate interactions
        await self._ingest_page_visits_and_interactions(dataframes)
        
        logger.info("Data ingestion completed successfully")
    
    async def _ingest_users(self, users_df: pd.DataFrame):
        """Ingest user data"""
        logger.info("Ingesting users...")
        
        users_collection = self.mongodb.get_collection("users")
        
        # Clear existing data
        await users_collection.delete_many({})
        
        users_data = []
        for _, row in users_df.iterrows():
            user = User(
                user_id=str(row['user_id']),
                date=pd.to_datetime(row['date']),
                device=row['device'],
                sex=row['sex']
            )
            users_data.append(user.dict(by_alias=True, exclude={'id'}))
        
        if users_data:
            await users_collection.insert_many(users_data)
            logger.info(f"Ingested {len(users_data)} users")
    
    async def _ingest_page_visits_and_interactions(self, dataframes: Dict[str, pd.DataFrame]):
        """Process page visits and generate synthetic interactions"""
        logger.info("Processing page visits and generating interactions...")
        
        # Collections
        visits_collection = self.mongodb.get_collection("page_visits")
        interactions_collection = self.mongodb.get_collection("user_interactions")
        sessions_collection = self.mongodb.get_collection("user_sessions")
        
        # Clear existing data
        await visits_collection.delete_many({})
        await interactions_collection.delete_many({})
        await sessions_collection.delete_many({})
        
        # Get user data for timestamps
        users_df = dataframes['users']
        user_dates = dict(zip(users_df['user_id'].astype(str), pd.to_datetime(users_df['date'])))
        user_devices = dict(zip(users_df['user_id'].astype(str), users_df['device']))
        
        # Process each page type
        page_mappings = {
            'home_page': 'home_page',
            'search_page': 'search_page', 
            'payment_page': 'payment_page',
            'payment_confirmation': 'payment_confirmation_page'
        }
        
        all_visits = []
        all_interactions = []
        user_visit_data = {}  # Track visits per user for session generation
        
        for df_key, page_name in page_mappings.items():
            if df_key not in dataframes:
                continue
                
            df = dataframes[df_key]
            logger.info(f"Processing {len(df)} visits for {page_name}")
            
            for _, row in df.iterrows():
                user_id = str(row['user_id'])
                
                if user_id not in user_dates:
                    continue  # Skip if user not found
                
                # Generate visit timestamp (same day as user registration + some hours)
                base_date = user_dates[user_id]
                visit_timestamp = base_date + timedelta(
                    hours=random.randint(1, 23),
                    minutes=random.randint(0, 59)
                )
                
                # Create page visit
                visit = PageVisit(
                    user_id=user_id,
                    page=page_name,
                    timestamp=visit_timestamp,
                    session_id=str(uuid.uuid4()),
                    duration=random.randint(30, 300)  # 30 seconds to 5 minutes
                )
                
                visit_dict = visit.dict(by_alias=True, exclude={'id'})
                all_visits.append(visit_dict)
                
                # Track user visits for session generation
                if user_id not in user_visit_data:
                    user_visit_data[user_id] = []
                user_visit_data[user_id].append(visit_dict)
                
                # Generate synthetic interactions for this visit
                interactions = self.generate_synthetic_interactions(
                    user_id, page_name, visit_timestamp
                )
                
                for interaction_data in interactions:
                    interaction = UserInteraction(**interaction_data)
                    interaction_dict = interaction.dict(by_alias=True, exclude={'id'})
                    all_interactions.append(interaction_dict)
        
        # Insert visits and interactions
        if all_visits:
            await visits_collection.insert_many(all_visits)
            logger.info(f"Ingested {len(all_visits)} page visits")
        
        if all_interactions:
            await interactions_collection.insert_many(all_interactions)
            logger.info(f"Generated and ingested {len(all_interactions)} user interactions")
        
        # Generate and insert sessions
        all_sessions = []
        user_interactions_by_user = {}
        
        # Group interactions by user
        for interaction in all_interactions:
            user_id = interaction['user_id']
            if user_id not in user_interactions_by_user:
                user_interactions_by_user[user_id] = []
            user_interactions_by_user[user_id].append(interaction)
        
        for user_id, visits in user_visit_data.items():
            user_interactions = user_interactions_by_user.get(user_id, [])
            session_data = self.generate_session_data(visits, user_interactions)
            
            if session_data:
                device = user_devices.get(user_id, 'Desktop')
                session = UserSession(
                    user_id=user_id,
                    session_id=session_data['session_id'],
                    start_time=session_data['start_time'],
                    end_time=session_data['end_time'],
                    pages_visited=session_data['pages_visited'],
                    total_interactions=session_data['total_interactions'],
                    device=device,
                    conversion_completed=session_data['conversion_completed']
                )
                
                session_dict = session.dict(by_alias=True, exclude={'id'})
                all_sessions.append(session_dict)
        
        if all_sessions:
            await sessions_collection.insert_many(all_sessions)
            logger.info(f"Generated and ingested {len(all_sessions)} user sessions")
    
    async def run_full_ingestion(self):
        """Run complete data ingestion pipeline"""
        try:
            logger.info("Starting full data ingestion pipeline...")
            
            # Initialize database
            await self.initialize()
            
            # Load CSV data
            dataframes = await self.load_csv_data()
            
            if not dataframes:
                logger.error("No data files found to ingest")
                return False
            
            # Process and ingest data
            await self.process_and_ingest_data(dataframes)
            
            logger.info("Full data ingestion pipeline completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error in data ingestion pipeline: {e}")
            return False


async def main():
    """Main function to run data ingestion"""
    logging.basicConfig(level=logging.INFO)
    
    pipeline = DataIngestionPipeline()
    success = await pipeline.run_full_ingestion()
    
    if success:
        print("✅ Data ingestion completed successfully!")
    else:
        print("❌ Data ingestion failed. Check logs for details.")


if __name__ == "__main__":
    asyncio.run(main())