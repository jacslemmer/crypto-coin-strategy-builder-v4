# Deployment Guide

This document provides comprehensive guidance for deploying the Crypto Coin Strategy Builder application across different environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [UAT Environment](#uat-environment)
- [Production Environment](#production-environment)
- [Docker Configuration](#docker-configuration)
- [Cloudflare Configuration](#cloudflare-configuration)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Overview

The application supports three deployment environments:

1. **Local Development** - Docker Compose setup for local development
2. **UAT Environment** - Cloudflare Workers + Pages for testing
3. **Production Environment** - Docker Compose + Cloudflare for production

## Prerequisites

### Required Software

- **Node.js** 18.18.0 or higher
- **Docker** and **Docker Compose**
- **Git** for version control
- **OpenSSL** for SSL certificate generation (local development)

### Required Accounts

- **Cloudflare Account** with Workers and Pages enabled
- **Cloudflare API Token** with appropriate permissions

### Required Environment Variables

```bash
# Cloudflare
export CLOUDFLARE_API_TOKEN="your-api-token"

# Sentry (optional)
export SENTRY_DSN="your-sentry-dsn"

# Redis (optional)
export REDIS_PASSWORD="your-redis-password"
```

## Local Development

### Quick Start

```bash
# Start local development environment
npm run deploy:local

# Or use Docker Compose directly
npm run docker:dev
```

### What Gets Started

- **Backend**: Node.js application on port 4000
- **Frontend**: Development server on port 3000
- **Database**: SQLite database with migrations
- **Redis**: Caching layer on port 6379
- **Nginx**: Reverse proxy on port 80/443

### Services Available

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Frontend | 3000 | http://localhost:3000 | Development server |
| Backend | 4000 | http://localhost:4000 | API server |
| Nginx | 80/443 | http://localhost | Reverse proxy |
| Redis | 6379 | localhost:6379 | Cache layer |
| Health Check | - | http://localhost/health | Service health |

### Useful Commands

```bash
# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Rebuild and restart
npm run docker:build && npm run docker:dev

# Check service status
docker-compose ps
```

## UAT Environment

### Deployment

```bash
# Deploy to UAT
npm run deploy:uat

# Or manually
./scripts/deploy-uat.sh
```

### Configuration

UAT uses `wrangler.uat.toml` with:
- Separate R2 bucket: `ccsb-screens-uat`
- Separate D1 database: `ccsb-db-uat`
- Separate KV namespace: `uat-logs`
- Debug logging enabled

### Verification

```bash
# Check deployment status
wrangler status --config wrangler.uat.toml

# View logs
wrangler tail --config wrangler.uat.toml

# Open dashboard
wrangler dashboard --config wrangler.uat.toml
```

## Production Environment

### Deployment

```bash
# Deploy to production
npm run deploy:prod

# Or manually
./scripts/deploy-prod.sh
```

### What Gets Deployed

1. **Docker Services**: Production-optimized containers
2. **Cloudflare Workers**: Production worker with production config
3. **SSL**: Production SSL certificates
4. **Monitoring**: Sentry integration and health checks

### Production Features

- **Auto-restart**: Services restart automatically on failure
- **Resource limits**: CPU and memory limits enforced
- **Health checks**: Automated health monitoring
- **SSL/TLS**: Full HTTPS support with security headers
- **Rate limiting**: API rate limiting and DDoS protection

## Docker Configuration

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Logging | Debug level | Info level |
| SSL | Self-signed | Production certs |
| Restart policy | Manual | Auto-restart |
| Resource limits | None | Enforced |
| Health checks | Basic | Comprehensive |

### Service Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Nginx     │    │  Frontend   │    │   Backend   │
│  (Proxy)    │◄──►│   (Port 3k) │    │  (Port 4k) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Redis    │    │   Database  │    │     R2      │
│   (Cache)   │    │   (SQLite)  │    │  (Storage)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Volume Management

- **Development**: Source code mounted as volumes for hot reloading
- **Production**: Persistent volumes for data and logs
- **SSL**: SSL certificates mounted from host

## Cloudflare Configuration

### Workers

- **Main Entry Point**: `dist/worker.js`
- **Compatibility**: Node.js compatibility enabled
- **Environments**: Separate configs for UAT and production

### R2 Storage

- **Development**: Local file system
- **UAT**: `ccsb-screens-uat` bucket
- **Production**: `ccsb-screens-prod` bucket

### D1 Database

- **Development**: Local SQLite
- **UAT**: `ccsb-db-uat` database
- **Production**: `ccsb-db-prod` database

### KV Namespaces

- **Development**: Local file system
- **UAT**: `uat-logs` namespace
- **Production**: `prod-logs` namespace

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `4000` | Server port |
| `LOG_LEVEL` | `debug` | Logging level |
| `LOGS_DIR` | `./tmp/logs` | Log directory |
| `D1_PATH` | `./tmp/db.sqlite` | Database path |
| `R2_ROOT` | `./tmp/r2` | R2 storage root |
| `SENTRY_DSN` | - | Sentry error reporting |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `VITE_API_URL` | `http://localhost:4000` | Backend API URL |
| `VITE_WS_URL` | `ws://localhost:4000` | WebSocket URL |

### Docker

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_PASSWORD` | - | Redis authentication |
| `APP_VERSION` | Git tag | Application version |

## Troubleshooting

### Common Issues

#### Docker Issues

```bash
# Service won't start
docker-compose logs [service-name]

# Port conflicts
docker-compose down
docker system prune -f
docker-compose up -d

# Permission issues
sudo chown -R $USER:$USER .
```

#### Cloudflare Issues

```bash
# Authentication failed
wrangler login

# Deployment failed
wrangler tail --config wrangler.uat.toml

# Check configuration
wrangler config list
```

#### SSL Issues

```bash
# Generate new self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout
```

### Health Checks

```bash
# Backend health
curl http://localhost:4000/health

# Nginx health
curl http://localhost/health

# Redis health
docker-compose exec redis redis-cli ping

# Overall status
docker-compose ps
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f [service-name]

# Cloudflare logs
wrangler tail --config wrangler.uat.toml
```

### Performance Monitoring

```bash
# Resource usage
docker stats

# Container inspection
docker-compose exec [service-name] top

# Network connectivity
docker-compose exec [service-name] ping [target]
```

## Security Considerations

### Production Security

- **SSL/TLS**: Always use HTTPS in production
- **Environment Variables**: Never commit secrets to version control
- **Resource Limits**: Enforce Docker resource limits
- **Health Checks**: Implement comprehensive health monitoring
- **Rate Limiting**: Protect against DDoS attacks
- **Security Headers**: Implement security headers in nginx

### Access Control

- **API Keys**: Rotate Cloudflare API tokens regularly
- **Database Access**: Limit database access to necessary services
- **Network Security**: Use Docker networks for service isolation
- **Monitoring**: Monitor for unauthorized access attempts

## Backup and Recovery

### Data Backup

```bash
# Database backup
docker-compose exec database sqlite3 /data/db.sqlite ".backup /data/backup-$(date +%Y%m%d).sqlite"

# R2 data backup (if using local storage)
tar -czf r2-backup-$(date +%Y%m%d).tar.gz tmp/r2/

# Logs backup
tar -czf logs-backup-$(date +%Y%m%d).tar.gz tmp/logs/
```

### Recovery

```bash
# Restore database
docker-compose exec database sqlite3 /data/db.sqlite ".restore /data/backup-20240825.sqlite"

# Restore R2 data
tar -xzf r2-backup-20240825.tar.gz

# Restart services
docker-compose restart
```

## Support

For deployment issues:

1. Check the logs: `npm run docker:logs`
2. Verify environment variables are set correctly
3. Check Docker and Cloudflare service status
4. Review this documentation for common solutions
5. Contact the development team for complex issues

---

**Last Updated**: August 25, 2024  
**Version**: 1.0.0


