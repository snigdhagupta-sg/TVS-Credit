# Deployment Documentation

## Overview
Comprehensive deployment guide for the funnel analysis application covering development setup, Docker containerization, production deployment, and monitoring strategies. Supports both local development and scalable production environments.

## Development Environment Setup

### Prerequisites
- Python 3.8+ with pip and virtual environment support
- Node.js 18+ with npm or pnpm package manager
- Docker and Docker Compose for service orchestration
- Git for version control

### Local Development Setup

#### Backend Setup
1. **Create Python Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or venv\Scripts\activate  # Windows
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start Database Services**
   ```bash
   docker-compose up -d
   ```

4. **Wait for Services to Initialize**
   - MongoDB: ~30 seconds
   - Milvus: ~2-3 minutes (includes etcd and MinIO)
   - Redis: ~10 seconds

5. **Ingest Sample Data**
   ```bash
   python data_ingestion.py
   ```

6. **Start FastAPI Development Server**
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup
1. **Navigate to Frontend Directory**
   ```bash
   cd dashboard/
   ```

2. **Install Node Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Environment Variables

#### Required Environment Variables
```bash
# Database Configuration
MONGODB_URL=mongodb://admin:password123@localhost:27017/funnel_analysis?authSource=admin
MILVUS_HOST=localhost
MILVUS_PORT=19530
REDIS_URL=redis://localhost:6379

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional Configuration
LOG_LEVEL=INFO
DEBUG=true
```

#### Environment File Setup
Create `.env` file in project root with appropriate values for your environment.

## Docker Deployment

### Docker Compose Architecture
The application uses multi-container Docker setup with the following services:

#### Core Services
- **MongoDB**: Document database with authentication
- **Milvus**: Vector database with etcd and MinIO dependencies
- **Redis**: Caching and session storage
- **FastAPI App**: Backend API server
- **Next.js App**: Frontend dashboard

#### Service Dependencies
```
MongoDB ← FastAPI App ← Next.js App
Milvus  ←     ↑
Redis   ←     ↑
```

### Production Docker Configuration

#### Multi-stage Dockerfile (Backend)
- **Base Stage**: Python runtime with system dependencies
- **Dependencies Stage**: Install Python packages
- **Application Stage**: Copy code and set up application
- **Production Stage**: Optimized runtime with security considerations

#### Next.js Docker Configuration
- **Dependencies Stage**: Node.js with package installation
- **Build Stage**: Application compilation and optimization
- **Runtime Stage**: Minimal production server

### Container Orchestration

#### Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

#### Production Environment
- Use Docker Swarm or Kubernetes for orchestration
- Implement proper secrets management
- Configure service discovery and load balancing
- Set up monitoring and logging aggregation

## Production Deployment

### Infrastructure Requirements

#### Minimum System Requirements
- **CPU**: 4 cores (8+ recommended for production)
- **RAM**: 8GB (16GB+ recommended)
- **Storage**: 50GB SSD (100GB+ for production data)
- **Network**: Stable internet connection with adequate bandwidth

#### Recommended Production Setup
- **Application Servers**: 2+ instances for high availability
- **Database Cluster**: MongoDB replica set with 3+ nodes
- **Vector Database**: Milvus distributed deployment
- **Load Balancer**: Nginx or cloud load balancer
- **Monitoring**: Prometheus, Grafana, ELK stack

### Cloud Deployment Options

#### AWS Deployment
- **ECS/EKS**: Container orchestration
- **DocumentDB**: Managed MongoDB-compatible service
- **ElastiCache**: Managed Redis service
- **Application Load Balancer**: Traffic distribution
- **CloudWatch**: Monitoring and logging

#### Google Cloud Platform
- **GKE**: Kubernetes-based container deployment
- **Cloud Firestore**: Alternative document database
- **Memorystore**: Managed Redis service
- **Cloud Load Balancing**: Global load distribution
- **Cloud Monitoring**: Comprehensive observability

#### Azure Deployment
- **AKS**: Azure Kubernetes Service
- **Cosmos DB**: Multi-model database service
- **Azure Cache for Redis**: Managed caching
- **Application Gateway**: Load balancing and SSL termination
- **Azure Monitor**: Application performance monitoring

### Security Considerations

#### Application Security
- Environment-based configuration management
- Secrets management with proper encryption
- API rate limiting and request validation
- HTTPS/TLS encryption for all communications
- CORS configuration for frontend access

#### Database Security
- Authentication and authorization for all database connections
- Network isolation and firewall configuration
- Data encryption at rest and in transit
- Regular security updates and patches
- Backup encryption and secure storage

#### Container Security
- Minimal base images with security scanning
- Non-root user execution
- Resource limits and constraints
- Network policies and segmentation
- Regular image updates and vulnerability scanning

## Monitoring and Observability

### Application Monitoring

#### Health Checks
- **Endpoint**: `/health` for application status
- **Database Connectivity**: MongoDB, Milvus, Redis health
- **Service Dependencies**: External API availability
- **Resource Utilization**: CPU, memory, disk usage

#### Performance Metrics
- **Response Times**: API endpoint performance tracking
- **Throughput**: Requests per second and concurrent users
- **Error Rates**: HTTP error status code monitoring
- **Database Performance**: Query execution times and connection pool usage

#### Logging Strategy
- **Structured Logging**: JSON format with consistent fields
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Request Tracing**: Request ID tracking across services
- **Security Logging**: Authentication and authorization events

### Infrastructure Monitoring

#### System Metrics
- CPU utilization and load average
- Memory usage and garbage collection
- Disk I/O and storage utilization
- Network traffic and connection monitoring

#### Database Monitoring
- **MongoDB**: Replica set status, query performance, collection statistics
- **Milvus**: Vector search performance, index status, memory usage
- **Redis**: Memory usage, key expiration, connection counts

#### Container Monitoring
- Container resource usage and limits
- Image vulnerability scanning results
- Orchestration platform health (Docker Swarm/Kubernetes)
- Service discovery and load balancing status

### Alerting Configuration

#### Critical Alerts
- Application service downtime
- Database connection failures
- High error rates (>5% of requests)
- Resource exhaustion (CPU >80%, Memory >90%)

#### Warning Alerts
- Increased response times (>2x normal)
- Database query performance degradation
- Cache miss rate increases
- Unusual traffic patterns

## Backup and Disaster Recovery

### Data Backup Strategy

#### MongoDB Backup
- Daily automated backups with 30-day retention
- Point-in-time recovery capability
- Cross-region backup replication
- Backup integrity verification

#### Milvus Vector Data
- Collection-level backup and restore
- Index reconstruction procedures
- Metadata backup for schema preservation
- Version-controlled embeddings

#### Application Data
- Configuration files and environment variables
- SSL certificates and secrets
- Application logs and monitoring data
- Container images and deployment artifacts

### Disaster Recovery Planning

#### Recovery Time Objectives (RTO)
- Critical services: <15 minutes
- Full application restore: <2 hours
- Complete data restoration: <4 hours

#### Recovery Point Objectives (RPO)
- Transactional data: <1 hour
- Analytics data: <24 hours
- Configuration changes: <1 hour

#### Recovery Procedures
1. Service health assessment and triage
2. Database restoration from latest backups
3. Application service redeployment
4. Data consistency verification
5. Performance validation and monitoring

## Scaling Strategies

### Horizontal Scaling

#### Application Scaling
- Stateless application design for easy scaling
- Load balancer configuration for multiple instances
- Session storage in Redis for session persistence
- Auto-scaling based on CPU/memory utilization

#### Database Scaling
- MongoDB sharding for large datasets
- Read replicas for query distribution
- Milvus distributed deployment for vector operations
- Redis clustering for cache scalability

### Vertical Scaling
- Resource optimization based on performance metrics
- Container resource limit adjustments
- Database server specifications upgrade
- Storage performance optimization

### Performance Optimization
- CDN implementation for static assets
- Database query optimization and indexing
- Caching strategy refinement
- Application code profiling and optimization

## Maintenance Procedures

### Regular Maintenance Tasks
- Security patches and system updates
- Database index optimization and cleanup
- Log rotation and archival
- Performance monitoring review and tuning
- Backup verification and disaster recovery testing

### Update Deployment Process
1. Staging environment testing
2. Gradual rollout with canary deployment
3. Performance monitoring during deployment
4. Rollback procedures if issues detected
5. Post-deployment validation and monitoring