# Full-Stack Data Management System

A complete microservices-based application with authentication, real-time data processing, and comprehensive monitoring capabilities.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Real-time Data Processing**: Kafka-based message streaming and CDC integration
- **Comprehensive Logging**: Structured JSON logging with log4js
- **Database Integration**: TiDB cloud database with connection pooling
- **Containerized Architecture**: Docker-based microservices deployment
- **Monitoring & Health Checks**: Built-in health endpoints and structured logging
- **Change Data Capture**: Real-time database change monitoring

## Technology Stack

### Frontend
- HTML5 + JavaScript (ES6+)
- Bootstrap 5.3 for responsive UI
- Client-side authentication with localStorage

### Backend
- **Node.js** with Express.js framework
- **JWT** for authentication
- **bcryptjs** for password hashing
- **MySQL2** for database connectivity

### Database
- **TiDB Cloud** (MySQL-compatible distributed database)
- Automatic schema initialization
- CDC (Change Data Capture) enabled

### Message Queue
- **Apache Kafka** with Zookeeper
- Real-time event streaming
- Topic-based message routing

### Monitoring & Logging
- **log4js** with multiple appenders
- Structured JSON logging
- Access logs, security logs, database logs
- Log rotation and compression

### DevOps
- **Docker** & **Docker Compose**
- Multi-stage builds
- Health checks and graceful shutdowns
- Non-root container security

## Prerequisites

- Docker Engine 20.0+
- Docker Compose 2.0+
- 4GB+ available RAM
- Internet connection for TiDB Cloud access

## Quick Start

### Option 1: Full Stack with Kafka (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>



# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### Option 2: Simple Deployment (No Kafka)

```bash
# Use the simplified configuration
docker-compose -f docker-compose.simple.yml up -d
```

### Option 3: Development Mode

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your TiDB credentials
# Start in development mode
npm run dev
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# TiDB Configuration
TIDB_HOST=gateway01.eu-central-1.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=your_user
TIDB_PASSWORD=your_password
TIDB_DATABASE=test
TIDB_REGION=eu-central-1

# Application Settings
JWT_SECRET=your_jwt_secret_key
SECRET_KEY=your_session_secret
PORT=3000
NODE_ENV=production

# Default User (created on startup)
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=admin123

# Kafka Configuration
KAFKA_BROKERS=kafka:29092
KAFKA_SSL=false
CDC_TOPICS=tidb-cdc
ENABLE_APP_TOPICS=true
```

### TiDB Setup

1. **Create TiDB Cloud Account**: Sign up at [tidbcloud.com](https://tidbcloud.com)
2. **Create Cluster**: Create a new TiDB Dedicated cluster (CDC requires Dedicated)
3. **Get Connection Details**: Copy host, port, username, and password
4. **Configure Environment**: Update `.env` with your TiDB credentials

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Service   │    │   CDC Consumer  │
│   (HTML/JS)     │◄──►│   (Node.js)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        │
┌─────────────────┐    ┌─────────────────┐              │
│     TiDB        │    │     Kafka       │◄─────────────┘
│   (Database)    │    │  (Message Bus)  │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Zookeeper     │
                       │ (Coordination)  │
                       └─────────────────┘
```

## Services

### API Service (Port 3000, 8080)
- Main application server
- Authentication and authorization
- Data management API
- Kafka event publishing
- Comprehensive logging

### Database Initialization (Run-once)
- Automatic schema creation
- Default user creation
- Sample data insertion
- TiDB connection validation

### CDC Consumer (Port 3001)
- Processes database change events
- Kafka message consumption
- Real-time data processing
- Change event logging

### Kafka & Zookeeper
- **Kafka**: Message broker (Port 9092)
- **Zookeeper**: Cluster coordination (Port 2181)

## Testing

### Test CDC Messages
```bash
# Send test CDC events to Kafka
node test-cdc-messages.js
```

### Manual Testing
```bash
# Check logs in real-time
docker-compose logs -f api

# Monitor specific service
docker-compose logs -f cdc-consumer
```

## Default Credentials

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

**Access URLs:**
- Application: `http://localhost:3000`
- Alternative Port: `http://localhost:8080`
- Health Check: `http://localhost:3000/health`



