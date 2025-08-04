# ClockPilot Production Deployment Checklist

## Pre-Deployment Checklist

### Security Configuration
- [ ] JWT_SECRET configured with 64+ character random string
- [ ] SESSION_SECRET configured with 64+ character random string  
- [ ] All database passwords are strong and unique
- [ ] Redis password configured (if using Redis)
- [ ] HTTPS certificates obtained and configured
- [ ] Rate limiting configured appropriately
- [ ] CORS origins restricted to production domains
- [ ] Security headers configured via Helmet.js

### Database Configuration
- [ ] Production database provisioned (recommended: managed service)
- [ ] Database connection pooling configured (recommended: 20 connections)
- [ ] Database backups automated
- [ ] Database monitoring enabled
- [ ] Database SSL/TLS encryption enabled

### Environment Variables
- [ ] NODE_ENV=production
- [ ] LOG_LEVEL=warn (or info for detailed logging)
- [ ] All feature flags configured appropriately
- [ ] Monitoring and alerting endpoints configured
- [ ] Email/SMTP configuration for notifications

### Monitoring & Logging
- [ ] Prometheus metrics collection enabled
- [ ] Grafana dashboards configured
- [ ] Log aggregation (Loki) configured
- [ ] Health check endpoints responding
- [ ] Alerting rules configured
- [ ] Sentry error tracking configured (optional)

### Performance Configuration
- [ ] Redis cache configured for sessions and data
- [ ] Compression middleware enabled
- [ ] Static asset caching configured
- [ ] Database indexes created
- [ ] Query optimization reviewed

## Deployment Process

### 1. Infrastructure Setup
```bash
# Clone production configuration
git clone <repository> clockpilot-production
cd clockpilot-production

# Copy and configure environment
cp .env.example .env.production
# Edit .env.production with production values
```

### 2. Security Verification
```bash
# Verify no test/development secrets
grep -r "test" .env.production
grep -r "localhost" .env.production
grep -r "example" .env.production

# Check file permissions
chmod 600 .env.production
```

### 3. Database Setup
```bash
# Run database migrations
npm run db:push

# Verify database connection
npm run db:health-check
```

### 4. Build and Test
```bash
# Build application
docker-compose -f docker-compose.prod.yml build

# Run security scan
docker scan clockpilot-app

# Test configuration
docker-compose -f docker-compose.prod.yml config
```

### 5. Deploy
```bash
# Deploy with our script
./scripts/deploy.sh

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

### 6. Post-Deployment Verification
```bash
# Check all services are healthy
docker-compose -f docker-compose.prod.yml ps

# Test health endpoints
curl https://your-domain.com/api/health/ready
curl https://your-domain.com/api/health/live

# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Verify monitoring
curl https://your-domain.com:3001  # Grafana
curl https://your-domain.com:9091  # Prometheus
```

## Post-Deployment Monitoring

### Daily Checks
- [ ] Check application status via health endpoints
- [ ] Review error logs for any issues
- [ ] Monitor response times and performance metrics
- [ ] Verify database and Redis connectivity
- [ ] Check disk space and memory usage

### Weekly Checks
- [ ] Review security logs for suspicious activity
- [ ] Check backup integrity and restoration process
- [ ] Update monitoring dashboards as needed
- [ ] Review and update rate limiting rules
- [ ] Performance optimization review

### Monthly Checks
- [ ] Security audit and vulnerability scan
- [ ] Update dependencies and base images
- [ ] Review and rotate secrets/certificates
- [ ] Capacity planning and scaling review
- [ ] Disaster recovery testing

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check configuration
docker-compose -f docker-compose.prod.yml config

# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET)"
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose -f docker-compose.prod.yml exec app npm run db:health-check

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Verify database configuration
docker-compose -f docker-compose.prod.yml exec postgres psql -U clockpilot_user -d clockpilot -c "SELECT 1;"
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor database performance
docker-compose -f docker-compose.prod.yml exec postgres pg_stat_activity

# Check Redis performance (if configured)
docker-compose -f docker-compose.prod.yml exec redis redis-cli info
```

### Emergency Procedures

#### Rollback Process
```bash
# Use deployment script rollback
./scripts/deploy.sh --rollback

# Or manual rollback
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml up -d
```

#### Database Restore
```bash
# List available backups
ls -la backups/

# Restore from backup
./scripts/restore-backup.sh backup_file.sql
```

## Security Incident Response

1. **Immediate Response**
   - Isolate affected systems
   - Change all passwords and secrets
   - Review security logs

2. **Investigation**
   - Analyze attack vectors
   - Check data integrity
   - Document incident details

3. **Recovery**
   - Apply security patches
   - Restore from clean backups if needed
   - Update security configurations

4. **Post-Incident**
   - Update security policies
   - Improve monitoring
   - Train team on lessons learned

## Performance Optimization

### Database Optimization
- Index usage analysis
- Query performance review
- Connection pooling tuning
- Cache hit ratio monitoring

### Application Optimization
- Memory usage monitoring
- CPU usage optimization
- Response time analysis
- Cache efficiency review

### Infrastructure Optimization
- Load balancing configuration
- CDN setup for static assets
- Auto-scaling configuration
- Resource allocation tuning

## Compliance & Auditing

### Data Protection (GDPR/CCPA)
- [ ] Data retention policies implemented
- [ ] User data export functionality
- [ ] User data deletion functionality
- [ ] Privacy policy updated
- [ ] Consent management configured

### Security Compliance
- [ ] Security audit logs maintained
- [ ] Access control reviews
- [ ] Encryption at rest and in transit
- [ ] Vulnerability management process
- [ ] Incident response procedures documented

### Business Continuity
- [ ] Backup and recovery procedures tested
- [ ] Disaster recovery plan documented
- [ ] High availability configuration
- [ ] Service level agreements defined
- [ ] Business impact analysis completed