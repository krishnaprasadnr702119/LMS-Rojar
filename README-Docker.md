# LMS Docker Setup

This project includes Docker configurations for both development and production environments.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Development Environment

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker-compose -f docker-compose.dev.yml up --build -d

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

```bash
# Start all services in production mode
docker-compose up --build

# Start in detached mode
docker-compose up --build -d

# Stop services
docker-compose down
```

## Services

### Database (PostgreSQL)
- **Port**: 5432
- **Database**: lmsdb
- **User**: lmsuser
- **Password**: lmspassword

### Backend (Flask)
- **Port**: 5000
- **Environment**: 
  - Development: Hot reload enabled
  - Production: Optimized for performance

### Frontend (React + Vite)
- **Port**: 3000
- **Environment**:
  - Development: Hot reload with Vite dev server
  - Production: Built and served with Vite preview

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `FLASK_ENV`: development/production
- `FLASK_DEBUG`: 1 for development, 0 for production

### Frontend
- `VITE_API_URL`: Backend API URL (development)
- `REACT_APP_API_URL`: Backend API URL (production)
- `NODE_ENV`: development/production

## File Structure

```
lms/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── backend/
│   ├── Dockerfile             # Production backend image
│   ├── Dockerfile.dev         # Development backend image
│   ├── .dockerignore
│   └── ...
├── frontend/
│   ├── Dockerfile             # Production frontend image
│   ├── Dockerfile.dev         # Development frontend image
│   ├── .dockerignore
│   └── ...
└── README-Docker.md           # This file
```

## Development Workflow

1. **Start development environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access services**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Database: localhost:5432

3. **Make changes**: Files are mounted as volumes, so changes are reflected immediately

4. **Stop services**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Production Deployment

1. **Build and start**:
   ```bash
   docker-compose up --build -d
   ```

2. **Check logs**:
   ```bash
   docker-compose logs -f [service-name]
   ```

3. **Scale services** (if needed):
   ```bash
   docker-compose up --scale backend=2 --scale frontend=2
   ```

## Database Management

### Initialize Database
```bash
# Run database initialization
docker-compose exec backend python init_db.py
```

### Access Database
```bash
# Connect to PostgreSQL
docker-compose exec db psql -U lmsuser -d lmsdb
```

### Backup Database
```bash
# Create backup
docker-compose exec db pg_dump -U lmsuser lmsdb > backup.sql
```

### Restore Database
```bash
# Restore from backup
cat backup.sql | docker-compose exec -T db psql -U lmsuser -d lmsdb
```

## Troubleshooting

### Clear all data and restart
```bash
docker-compose down -v
docker-compose up --build
```

### Rebuild specific service
```bash
docker-compose build [service-name]
docker-compose up [service-name]
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Access service shell
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh
```

## Notes

- The database data is persisted in a Docker volume `db_data`
- Uploaded files are stored in `backend/uploads` which is mounted as a volume
- Frontend uses Vite for fast development with HMR (Hot Module Replacement)
- Backend uses Flask with auto-reload in development mode
