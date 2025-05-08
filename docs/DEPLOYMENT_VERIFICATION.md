# Deployment Verification Guide

This document outlines the verification steps to ensure proper deployment of the OFAuto infrastructure and application.

## 1. Infrastructure Verification

### VPC and Network Configuration

```bash
# Verify VPC creation
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=ofauto-vpc"

# Verify subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-id"

# Verify route tables and internet gateway
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-id"
aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=vpc-id"
```

### Database Verification

```bash
# Verify RDS instance
aws rds describe-db-instances --db-instance-identifier ofauto-db

# Test database connectivity
psql -h <rds-endpoint> -U <master-username> -d ofauto

# Verify Multi-AZ configuration
aws rds describe-db-instances --db-instance-identifier ofauto-db --query "DBInstances[*].MultiAZ"
```

### ElastiCache Verification

```bash
# Verify Redis cluster
aws elasticache describe-cache-clusters --cache-cluster-id ofauto-redis

# Test Redis connectivity
redis-cli -h <redis-endpoint> -p 6379 ping
```

### ECS and Container Deployment

```bash
# Verify ECS cluster
aws ecs describe-clusters --clusters ofauto-cluster

# Check service status
aws ecs describe-services --cluster ofauto-cluster --services ofauto-service

# Verify running tasks
aws ecs list-tasks --cluster ofauto-cluster --service-name ofauto-service
aws ecs describe-tasks --cluster ofauto-cluster --tasks <task-id>
```

### Load Balancer Verification

```bash
# Verify ALB configuration
aws elbv2 describe-load-balancers --names ofauto-alb

# Check target groups
aws elbv2 describe-target-groups --load-balancer-arn <alb-arn>

# Verify target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

### DNS and Route53 Verification

```bash
# Verify hosted zone
aws route53 get-hosted-zone --id <hosted-zone-id>

# Check DNS records
aws route53 list-resource-record-sets --hosted-zone-id <hosted-zone-id>

# Verify domain resolution
dig +short api.yourdomain.com
```

### Vault and Secrets Management

```bash
# Check Vault status
curl -s https://vault.yourdomain.com/v1/sys/health | jq

# Verify Vault is unsealed
vault status -address=https://vault.yourdomain.com

# Check secret engine configuration
vault secrets list -address=https://vault.yourdomain.com
```

## 2. Application Verification

### Smoke Tests

```bash
# Test API health endpoint
curl -s https://api.yourdomain.com/api/health | jq

# Test authentication
curl -s -H "Authorization: Bearer <test-token>" https://api.yourdomain.com/api/auth/check

# Verify database connection
curl -s https://api.yourdomain.com/api/database/status | jq
```

### End-to-End Test Suite

Run the automated E2E test suite against the deployed environment:

```bash
npm run test:e2e -- --baseUrl=https://app.yourdomain.com
```

### Manual Verification Checklist

- [ ] Verify user login and authentication flow
- [ ] Test campaign creation and management
- [ ] Check template editor functionality
- [ ] Verify analytics dashboard data displays correctly
- [ ] Test automated workflow triggers
- [ ] Verify responsiveness on mobile devices
- [ ] Check that file uploads and media handling work correctly
- [ ] Test notification system

## 3. Continuous Deployment Pipeline Verification

### GitHub Actions Workflow

1. Verify successful workflow runs:
   ```bash
   gh run list --workflow=.github/workflows/cd.yml --limit 5
   ```

2. Check individual workflow steps:
   ```bash
   gh run view <run-id>
   ```

3. Ensure all expected stages are included:
   - Build and test
   - Infrastructure validation
   - Terraform plan and apply
   - Database migrations
   - Container build and push
   - ECS deployment
   - Smoke tests

### Deployment Logs

```bash
# Check CloudWatch logs for the ECS tasks
aws logs get-log-events --log-group-name /ecs/ofauto --log-stream-name <log-stream-name>

# View application logs
aws logs filter-log-events --log-group-name /ecs/ofauto --filter-pattern "ERROR"
```

## 4. Rollback Procedure

In case verification fails, follow these rollback steps:

1. Revert to previous ECS task definition:
   ```bash
   aws ecs update-service --cluster ofauto-cluster --service ofauto-service --task-definition <previous-task-def>
   ```

2. Roll back database migrations:
   ```bash
   # Connect to the database
   psql -h <rds-endpoint> -U <master-username> -d ofauto
   
   # Run rollback script
   \i rollback_migration.sql
   ```

3. Revert infrastructure changes if needed:
   ```bash
   cd infra/terraform/environments/staging
   git checkout <previous-commit>
   terraform apply
   ```

## 5. Performance Verification

### Load Testing

Run a load test against the deployed environment:

```bash
k6 run load-test.js -e URL=https://api.yourdomain.com
```

### Monitoring Setup Verification

1. Verify CloudWatch alarms are properly configured:
   ```bash
   aws cloudwatch describe-alarms --alarm-name-prefix ofauto
   ```

2. Check that CloudWatch Dashboards are available:
   ```bash
   aws cloudwatch list-dashboards
   ```

3. Verify that logs are being properly collected:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /ecs/ofauto
   ```

4. Check that Sentry is receiving error reports:
   - Navigate to your Sentry project dashboard
   - Verify that the environment appears in the dropdown
   - Check for any reported errors

## 6. Security Verification

### SSL/TLS Configuration

```bash
# Check SSL certificate
nmap --script ssl-cert -p 443 api.yourdomain.com

# Verify SSL configuration rating
curl -s https://api.ssllabs.com/api/v3/analyze?host=api.yourdomain.com | jq
```

### IAM Roles and Permissions

```bash
# Verify ECS task role permissions
aws iam get-role --role-name ofauto-ecs-task-role

# Check task execution role
aws iam get-role --role-name ofauto-ecs-task-execution-role

# List attached policies
aws iam list-attached-role-policies --role-name ofauto-ecs-task-role
```

### Security Groups

```bash
# Verify security group rules
aws ec2 describe-security-groups --filters "Name=tag:Name,Values=ofauto-*"
```

## 7. Post-Deployment Actions

1. Update deployment documentation with any encountered issues and solutions
2. Tag the release in GitHub:
   ```bash
   git tag -a v1.0.0 -m "Initial production deployment"
   git push origin v1.0.0
   ```
3. Create a deployment report including:
   - Deployment time and duration
   - New features and changes
   - Performance metrics
   - Any issues encountered
4. Schedule a retrospective meeting to discuss the deployment process 