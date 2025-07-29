# LMS Deployment Guide

This guide explains how to deploy the LMS (Learning Management System) on another system.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 10GB free space
- **Network**: Internet connection for downloading dependencies

### Required Software
- **Git** (for cloning repository)
- **Docker & Docker Compose** (recommended approach)
- **OR** Manual setup with:
  - Python 3.11+
  - Node.js 18+
  - PostgreSQL 15+

## 🚀 Method 1: Docker Deployment (Recommended)

### Step 1: Install Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in

# CentOS/RHEL
sudo yum install docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# macOS
# Download Docker Desktop from https://docker.com

# Windows
# Install Docker Desktop with WSL2 backend
```

### Step 2: Clone Repository
```bash
git clone https://github.com/krishnaprasadnr702119/LMS-Rojar.git
cd LMS-Rojar
```

### Step 3: Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### Step 4: Deploy with Docker
```bash
# For Production
chmod +x start_prod_docker.sh
./start_prod_docker.sh

# OR manually
docker-compose up --build -d

# For Development
chmod +x start_dev_docker.sh
./start_dev_docker.sh

# OR manually
docker-compose -f docker-compose.dev.yml up --build -d
```

### Step 5: Initialize Database
```bash
# Wait for services to start (30 seconds), then initialize database
docker-compose exec backend python init_db.py
```

### Step 6: Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## 🛠️ Method 2: Manual Deployment

### Step 1: Install Dependencies

#### Python Backend
```bash
# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3.11-dev

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Node.js Frontend
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Clone and Setup Repository
```bash
git clone https://github.com/krishnaprasadnr702119/LMS-Rojar.git
cd LMS-Rojar
```

### Step 3: Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE lmsdb;
CREATE USER lmsuser WITH PASSWORD 'lmspassword';
GRANT ALL PRIVILEGES ON DATABASE lmsdb TO lmsuser;
\q
```

### Step 4: Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python3.11 -m venv ../.venv
source ../.venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://lmsuser:lmspassword@localhost:5432/lmsdb"
export FLASK_ENV=production

# Initialize database
python init_db.py

# Start backend
python app.py
```

### Step 5: Frontend Setup
```bash
# Open new terminal
cd LMS-Rojar/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start frontend
npm run preview -- --host 0.0.0.0 --port 3000
```

## 🌐 Production Deployment (Server)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install nginx certbot python3-certbot-nginx ufw

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Step 2: Domain Configuration
```bash
# Edit nginx configuration
sudo nano /etc/nginx/sites-available/lms

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

### Step 4: Process Management
```bash
# Install PM2 for process management
sudo npm install -g pm2

# Backend process
cd /path/to/LMS-Rojar/backend
pm2 start app.py --name lms-backend --interpreter python3

# Frontend process  
cd /path/to/LMS-Rojar/frontend
pm2 start "npm run preview -- --host 0.0.0.0 --port 3000" --name lms-frontend

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔧 Configuration Files

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://lmsuser:lmspassword@localhost:5432/lmsdb

# Flask
FLASK_ENV=production
FLASK_DEBUG=0

# Email (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Frontend
REACT_APP_API_URL=http://your-domain.com
VITE_API_URL=http://your-domain.com
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 5000
sudo lsof -t -i:5000 | xargs sudo kill -9

# Kill process on port 3000
sudo lsof -t -i:3000 | xargs sudo kill -9
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset PostgreSQL
sudo systemctl restart postgresql

# Check database connection
psql -h localhost -U lmsuser -d lmsdb
```

#### Docker Issues
```bash
# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Log Files
- **Backend logs**: Check terminal output or docker logs
- **Frontend logs**: Browser console or docker logs
- **Database logs**: `/var/log/postgresql/`
- **Nginx logs**: `/var/log/nginx/`

## 📊 System Monitoring

### Check Service Status
```bash
# Docker containers
docker-compose ps

# System services
sudo systemctl status nginx
sudo systemctl status postgresql

# PM2 processes
pm2 status
pm2 logs
```

### Performance Monitoring
```bash
# System resources
htop
df -h
free -h

# Database queries
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Docker deployment
docker-compose down
docker-compose up --build -d

# Manual deployment
# Restart backend and frontend services
```

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U lmsuser lmsdb > lms_backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U lmsuser -d lmsdb < lms_backup_20250129.sql
```

## 📞 Support

If you encounter issues:
1. Check logs for error messages
2. Verify all services are running
3. Ensure ports are not blocked by firewall
4. Check database connectivity
5. Verify environment variables are set correctly

## 🎯 Quick Start Commands

```bash
# Complete Docker deployment
git clone https://github.com/krishnaprasadnr702119/LMS-Rojar.git
cd LMS-Rojar
docker-compose up --build -d
docker-compose exec backend python init_db.py

# Access at http://localhost:3000
```
