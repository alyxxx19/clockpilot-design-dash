# ClockPilot - Production Deployment Guide

## 🚀 Overview

ClockPilot is a comprehensive workforce management platform designed for production environments with enterprise-grade security, monitoring, and deployment capabilities.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Security](#security)
- [Monitoring](#monitoring)
- [Deployment](#deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ (Production)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended
- **Network**: HTTPS/SSL certificate for production

### Software Dependencies
- Docker 24.0+ and Docker Compose v2
- PostgreSQL 15+ (managed service recommended)
- Redis 7+ (managed service recommended)
- Nginx 1.20+ (for reverse proxy)

### Managed Services (Recommended)
- **Database**: AWS RDS, Google Cloud SQL, or Azure Database
- **Cache**: AWS ElastiCache, Google Memorystore, or Azure Cache for Redis
- **Monitoring**: AWS CloudWatch, Google Cloud Monitoring, or Azure Monitor
- **Backups**: AWS S3, Google Cloud Storage, or Azure Blob Storage

## ⚡ Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/clockpilot.git
cd clockpilot

# Generate production secrets
./scripts/generate-secrets.sh --write-env

# Review and update configuration
nano .env.production
```

### 2. Deploy to Production
```bash
# Full deployment with health checks
./scripts/deploy.sh --production

# Or deploy with force (skip confirmations)
./scripts/deploy.sh --production --force
```

### 3. Verify Deployment
```bash
# Check application health
curl https://your-domain.com/api/health/live

# Access monitoring
# Grafana: https://your-domain.com:3001
# Prometheus: https://your-domain.com:9091
```

## ⚙️ Configuration

### Environment Variables

#### Core Application
```bash
NODE_ENV=production
PORT=5000
BASE_URL=https://clockpilot.yourdomain.com
```

#### Database Configuration
```bash
DATABASE_URL=postgresql://user:password@host:5432/clockpilot_prod
DATABASE_POOL_SIZE=20
```

#### Security Configuration
```bash
JWT_SECRET=your-64-char-secret
SESSION_SECRET=your-64-char-secret
BCRYPT_ROUNDS=12
FORCE_HTTPS=true
SECURE_COOKIES=true
```

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window
```

#### Monitoring
```bash
LOG_LEVEL=warn
ENABLE_METRICS=true
SENTRY_DSN=your-sentry-dsn
```

### Complete Configuration Template

See `.env.production.template` for the complete configuration template with all available options.

## 🔒 Security

### Security Features

#### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Session management with Redis
- Password hashing with bcrypt (12 rounds)

#### Network Security
- HTTPS/TLS encryption enforced
- Security headers via Helmet.js
- CORS protection with domain restrictions
- Rate limiting on all endpoints

#### Application Security
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with content security policy
- Request timeout protection

#### Infrastructure Security
- Non-root Docker containers
- Secrets management with environment variables
- Database connection encryption
- Regular security scanning with Trivy

### Security Checklist

- [ ] SSL/TLS certificates installed and configured
- [ ] Strong passwords and secrets generated
- [ ] Database access restricted to application only
- [ ] Firewall configured to allow only necessary ports
- [ ] Regular security updates scheduled
- [ ] Backup encryption enabled
- [ ] Security monitoring and alerting configured

## 📊 Monitoring

### Health Endpoints

#### Liveness Probe
```bash
GET /api/health/live
# Returns: {"status":"alive","timestamp":"...","uptime":123}
```

#### Readiness Probe
```bash
GET /api/health/ready
# Returns detailed health status including database and Redis
```

### Metrics Collection

#### Prometheus Metrics
- Application performance metrics
- Database connection metrics
- Request/response metrics
- Error rate tracking
- Custom business metrics

#### Grafana Dashboards
- Real-time application monitoring
- Database performance tracking
- User activity analytics
- System resource monitoring

### Log Management

#### Structured Logging
- Application logs: `/logs/app.log`
- Error logs: `/logs/error.log`
- Security logs: `/logs/security.log`
- Audit logs: `/logs/audit.log`

#### Log Aggregation with Loki
- Centralized log collection
- Log parsing and labeling
- Log retention policies
- Alert rules on log patterns

### Alerting Rules

#### Critical Alerts
- Application down (immediate)
- Database connection failure (immediate)
- High error rate (5 minutes)
- Memory usage > 90% (10 minutes)

#### Warning Alerts
- Response time > 2s (15 minutes)
- Disk usage > 80% (30 minutes)
- Failed login attempts (threshold based)

## 🚀 Deployment

### Deployment Strategies

#### Production Deployment
```bash
# Standard production deployment
./scripts/deploy.sh --production

# With backup creation
./scripts/deploy.sh --production --backup-only
./scripts/deploy.sh --production

# Force deployment (CI/CD)
./scripts/deploy.sh --production --force
```

#### Staging Deployment
```bash
# Deploy to staging environment
./scripts/deploy.sh --staging
```

#### Rollback
```bash
# Rollback to previous version
./scripts/deploy.sh --rollback

# Check current status
./scripts/deploy.sh --check-only
```

### CI/CD Pipeline

#### GitHub Actions Workflow
- Automated testing on pull requests
- Security scanning with Trivy
- Staging deployment on merge to main
- Production deployment on release tags

#### Deployment Phases
1. **Build Phase**: Docker image creation and scanning
2. **Test Phase**: Automated test suite execution
3. **Deploy Phase**: Rolling deployment with health checks
4. **Verify Phase**: Health checks and smoke tests

### Blue-Green Deployment (Advanced)

For zero-downtime deployments:
1. Deploy to green environment
2. Run health checks and tests
3. Switch traffic to green environment
4. Keep blue environment as backup

## 🔧 Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check application health endpoints
- [ ] Review error logs
- [ ] Monitor performance metrics
- [ ] Verify backup completion

#### Weekly
- [ ] Review security logs
- [ ] Check disk space and cleanup logs
- [ ] Update monitoring dashboards
- [ ] Review rate limiting effectiveness

#### Monthly
- [ ] Security scan and vulnerability assessment
- [ ] Backup restoration testing
- [ ] Performance optimization review
- [ ] Update dependencies and base images

### Database Maintenance

#### Automated Backups
```bash
# Daily automated backups
0 2 * * * /app/scripts/backup-database.sh

# Weekly full backup
0 3 * * 0 /app/scripts/backup-database.sh --full
```

#### Database Optimization
- Regular VACUUM and ANALYZE operations
- Index usage analysis and optimization
- Query performance monitoring
- Connection pool tuning

### Log Rotation and Cleanup

#### Automated Log Management
- Log rotation every 24 hours
- Retention period: 30 days for application logs
- Retention period: 90 days for audit logs
- Compression after 7 days

## 🔍 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check Docker containers
docker-compose -f docker-compose.prod.yml ps

# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Verify environment configuration
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE|REDIS|JWT)"
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose -f docker-compose.prod.yml exec app npm run db:health-check

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Verify database configuration
echo $DATABASE_URL
```

#### Performance Issues
```bash
# Check system resources
docker stats

# Monitor database performance
docker-compose -f docker-compose.prod.yml exec postgres pg_stat_activity

# Check Redis performance
docker-compose -f docker-compose.prod.yml exec redis redis-cli info
```

### Error Codes

#### HTTP Error Responses
- `401 Unauthorized`: Check JWT token validity
- `403 Forbidden`: Verify user permissions
- `429 Too Many Requests`: Rate limiting triggered
- `500 Internal Server Error`: Check application logs

#### Database Error Codes
- `CONNECTION_ERROR`: Database server unreachable
- `TIMEOUT_ERROR`: Query execution timeout
- `CONSTRAINT_VIOLATION`: Data validation failed

### Recovery Procedures

#### Application Recovery
```bash
# Restart application
docker-compose -f docker-compose.prod.yml restart app

# Full restart with cleanup
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

#### Database Recovery
```bash
# Restore from latest backup
./scripts/restore-backup.sh latest

# Restore from specific backup
./scripts/restore-backup.sh backup_20250104_120000.sql
```

## 📞 Support

### Emergency Contacts
- **Operations Team**: ops@yourcompany.com
- **Development Team**: dev@yourcompany.com
- **Security Team**: security@yourcompany.com

### Monitoring Dashboards
- **Grafana**: https://monitoring.yourdomain.com
- **Prometheus**: https://metrics.yourdomain.com
- **Log Aggregation**: https://logs.yourdomain.com

### Documentation
- **API Documentation**: https://api-docs.yourdomain.com
- **User Guide**: https://docs.yourdomain.com
- **Security Policies**: https://security.yourdomain.com

## 📈 Performance Benchmarks

### Expected Performance
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: 1000+ requests/minute
- **Availability**: 99.9% uptime
- **Database**: < 50ms query response time

### Load Testing
```bash
# Run performance tests
npm run test:performance

# Load testing with Artillery
npm run test:load

# Stress testing
npm run test:stress
```

## 🔄 Scaling

### Horizontal Scaling
- Load balancer configuration
- Multiple application instances
- Database read replicas
- Redis clustering

### Vertical Scaling
- Increase container resources
- Optimize database configuration
- Upgrade hardware specifications

### Auto-scaling Configuration
- CPU-based scaling triggers
- Memory-based scaling triggers
- Response time thresholds
- Queue depth monitoring

---

## 📝 Version History

- **v2.0.0** - Production deployment configuration with enterprise features
- **v1.5.0** - Enhanced monitoring and security features
- **v1.0.0** - Initial production release

For detailed release notes, see [CHANGELOG.md](CHANGELOG.md).

---

**ClockPilot Production Deployment Guide**  
Last Updated: January 4, 2025  
Version: 2.0.0