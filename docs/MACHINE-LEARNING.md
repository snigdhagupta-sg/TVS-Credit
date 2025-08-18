# Machine Learning Documentation

## Overview
ML-powered analytics system featuring Two Tower deep learning architecture for user similarity analysis and pattern-based sentiment analysis. Integrates TensorFlow/Keras models with vector database storage for real-time recommendations and insights.

## Architecture

### Two Tower Model (`two_tower_model.py`)
Deep learning architecture for user-item interaction modeling and similarity search.

**Model Components:**
- **User Tower**: Encodes user features (device type, session count, interaction patterns)
- **Item Tower**: Encodes page/interaction features (page type, interaction type, duration)
- **Embedding Layers**: 128-dimensional dense representations
- **Similarity Computation**: Dot product similarity between user and item embeddings

**Training Process:**
1. Feature extraction from user interactions and page visits
2. Positive/negative sampling for contrastive learning
3. Joint training of both towers with shared loss function
4. Embedding optimization for maximum discrimination
5. Model evaluation with validation metrics

### Sentiment Analysis (`sentiment_analyzer.py`)
Rule-based sentiment analysis with transformer model fallback for comprehensive text sentiment classification.

**Analysis Methods:**
- **Pattern-Based**: Keyword matching with sentiment lexicons
- **Transformer Fallback**: BERT-based models for complex text analysis
- **Page-Specific**: Tailored sentiment rules for different funnel pages
- **Aggregation**: Statistical sentiment distribution across user segments

## Data Processing Pipeline

### Feature Engineering
**User Features:**
- Device type encoding (desktop, mobile, tablet)
- Session frequency and duration patterns
- Interaction density and patterns
- Conversion history and behavior

**Interaction Features:**
- Page type encoding (home, search, payment, confirmation)
- Interaction type classification (click, scroll, hover, form)
- Temporal patterns and session timing
- Engagement depth metrics

**Preprocessing Steps:**
1. Data normalization and scaling
2. Categorical encoding with proper dimensionality
3. Sequence padding for variable-length interactions
4. Missing value imputation strategies

### Vector Embedding Generation
**Embedding Storage in Milvus:**
- User behavior vectors: 128-dimensional representations
- Page interaction vectors: Context-aware embeddings
- Batch processing for efficient storage
- Index optimization for fast similarity search

**Update Strategy:**
- Incremental embedding updates with new data
- Batch reprocessing for model improvements
- Version control for embedding consistency
- Performance monitoring and optimization

## Model Training and Evaluation

### Training Pipeline
**Data Preparation:**
- Training/validation/test split (70/15/15)
- Stratified sampling for balanced representation
- Data augmentation for robustness
- Cross-validation for model selection

**Training Process:**
1. Model initialization with random weights
2. Mini-batch gradient descent optimization
3. Early stopping with validation loss monitoring
4. Learning rate scheduling for convergence
5. Regularization to prevent overfitting

**Hyperparameter Optimization:**
- Embedding dimension tuning (64, 128, 256)
- Learning rate optimization (1e-3 to 1e-5)
- Batch size selection for optimal convergence
- Regularization strength adjustment

### Model Evaluation Metrics
**Similarity Search Performance:**
- Top-K accuracy for similar user recommendations
- Mean Average Precision (MAP) for ranking quality
- Recall at different K values (5, 10, 20)
- Embedding quality through t-SNE visualization

**Training Metrics:**
- Training and validation loss curves
- Convergence rate and stability
- Gradient magnitude monitoring
- Model complexity vs. performance trade-offs

### Model Versioning and Management
- Model artifact storage with versioning
- A/B testing framework for model comparison
- Performance monitoring in production
- Rollback capabilities for model issues

## Real-time Inference

### Similarity Search
**User Similarity Pipeline:**
1. Query user embedding retrieval from Milvus
2. Vector similarity search with cosine distance
3. Top-K similar user identification
4. Similarity score ranking and filtering
5. Real-time recommendation generation

**Performance Optimization:**
- Approximate nearest neighbor search (ANN)
- Index optimization for query speed
- Caching frequently requested similarities
- Batch processing for multiple queries

### Recommendation System
**Personalization Features:**
- User-based collaborative filtering
- Content-based recommendations using embeddings
- Hybrid approach combining multiple signals
- Real-time adaptation to user behavior

**Recommendation Types:**
- Similar user discovery for marketing insights
- Behavioral pattern recommendations
- Conversion optimization suggestions
- Personalized funnel step guidance

## Sentiment Analysis Implementation

### Pattern-Based Analysis
**Keyword Classification:**
- Positive sentiment keywords (great, excellent, love, satisfied)
- Negative sentiment keywords (terrible, hate, disappointed, frustrated)
- Neutral pattern detection
- Context-aware sentiment scoring

**Page-Specific Rules:**
- **Home Page**: Brand and first impression sentiment
- **Search Page**: Product discovery satisfaction
- **Payment Page**: Trust and security concerns
- **Confirmation Page**: Purchase completion satisfaction

### Advanced Sentiment Processing
**Text Preprocessing:**
- Tokenization and normalization
- Stop word removal and lemmatization
- Emoji and emoticon handling
- Spelling correction for user-generated content

**Sentiment Aggregation:**
- User-level sentiment scoring
- Page-level sentiment distribution
- Time-based sentiment trends
- Demographic sentiment analysis

## Production Deployment

### Model Serving
**API Integration:**
- FastAPI endpoints for model predictions
- Async processing for high throughput
- Request batching for efficiency
- Response caching for repeated queries

**Scalability Considerations:**
- Model loading and memory management
- GPU acceleration for large models
- Horizontal scaling with load balancing
- Resource monitoring and auto-scaling

### Monitoring and Maintenance
**Performance Monitoring:**
- Prediction latency tracking
- Model accuracy degradation detection
- Data drift monitoring
- Resource utilization alerts

**Model Updates:**
- Scheduled retraining with fresh data
- A/B testing for model improvements
- Gradual rollout of new model versions
- Automated quality assurance checks

## Data Requirements

### Training Data Volume
- Minimum 10K user interactions for stable training
- Recommended 100K+ interactions for production quality
- Balanced representation across device types and pages
- Historical data spanning multiple months for trends

### Data Quality Assurance
- Data validation and consistency checks
- Outlier detection and handling
- Missing value imputation strategies
- Data versioning for reproducible training

### Privacy and Ethics
- User data anonymization for training
- Compliance with data protection regulations
- Bias detection and mitigation in recommendations
- Transparent model decision making

## Future Enhancements

### Advanced ML Techniques
- Transformer-based user behavior modeling
- Graph neural networks for user relationship modeling
- Reinforcement learning for dynamic recommendations
- Multi-task learning for unified user understanding

### Real-time Learning
- Online learning for immediate model updates
- Stream processing for continuous training
- Adaptive models responding to user behavior changes
- Edge deployment for low-latency inference

### Enhanced Features
- Multi-modal analysis (text, images, behavior)
- Temporal modeling for seasonal patterns
- Cross-device user identification and tracking
- Advanced personalization with contextual awareness