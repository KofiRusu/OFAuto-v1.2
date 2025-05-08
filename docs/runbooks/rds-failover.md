# RDS Multi-AZ Failover Runbook

## Overview

This runbook provides step-by-step guidance for handling a manual failover for Amazon RDS in a Multi-AZ configuration. Use this procedure when you need to switch from the primary to the standby RDS instance.

## Prerequisites

- AWS Console access with appropriate IAM permissions
- AWS CLI configured with necessary permissions
- Database connection credentials

## Symptoms

Indicators that may require a failover:
- High database latency or timeouts
- Degraded performance in the primary AZ
- Planned maintenance requiring AZ switchover
- AWS notification of problems in the primary AZ

## Procedure

### 1. Verify the Issue

Before initiating a failover, confirm there's an actual problem:

```bash
# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier ofauto-db --query 'DBInstances[0].DBInstanceStatus'

# Check for recent events
aws rds describe-events --source-identifier ofauto-db --source-type db-instance --duration 60
```

### 2. Pre-Failover Preparation

1. Notify the team via Slack in the #ops channel
   ```
   @here Performing RDS failover on ofauto-db due to [REASON]. Expect 60-120 seconds of database unavailability.
   ```

2. Check current connections and ensure no critical operations are in progress
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
   ```

3. If possible, temporarily route traffic away from the database or enable maintenance mode

### 3. Initiate Failover

#### Using AWS Console:
1. Navigate to RDS Dashboard
2. Select the `ofauto-db` instance
3. Choose "Actions" > "Reboot"
4. Select "Reboot With Failover"
5. Confirm the action

#### Using AWS CLI:
```bash
aws rds reboot-db-instance --db-instance-identifier ofauto-db --force-failover
```

### 4. Monitor Failover Progress

1. Watch for the status change in the AWS Console or CLI:
   ```bash
   aws rds describe-db-instances --db-instance-identifier ofauto-db --query 'DBInstances[0].DBInstanceStatus'
   ```
   
2. Monitor CloudWatch metrics during the transition:
   - `CPUUtilization`
   - `DatabaseConnections`
   - `FreeableMemory`
   - `ReadLatency` and `WriteLatency`

3. Expected timeline:
   - Failover typically completes within 60-120 seconds
   - Connection strings remain the same due to DNS update

### 5. Post-Failover Verification

1. Verify the new primary DB instance is operating correctly:
   ```bash
   # Check if database accepts connections
   psql -h ${RDS_ENDPOINT} -U ${DB_USER} -d ofauto -c "SELECT 1"
   ```

2. Verify application connectivity and functionality
   ```bash
   # Hit the application health endpoint
   curl https://app.ofauto.com/api/health
   
   # Check application logs for database connectivity issues
   ```

3. Check for any replication lag or performance issues

### 6. Post-Incident Tasks

1. Send an "all clear" notification to the team
   ```
   @here RDS failover completed successfully. System is operating normally.
   ```

2. Document the incident in the incident management system
3. Create a ticket for any follow-up tasks
4. Schedule a post-mortem if necessary

## Rollback Plan

If the failover causes unexpected issues, you can trigger another failover to go back to the original AZ. Follow the same process as above.

## Contact Information

- DBA team: #db-support Slack channel
- AWS Support: Portal link in internal wiki
- On-call phone: +1-555-123-4567

## Related Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_AZ.html#USER_AZ.FIO)
- [Internal Database Documentation](https://wiki.internal/ofauto/database)
- [Monitoring Dashboard](https://monitoring.ofauto.com/dashboards/rds) 