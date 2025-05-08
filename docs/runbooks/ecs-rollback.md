# ECS Service Rollback Runbook

## Overview

This runbook provides step-by-step instructions for rolling back an ECS service to a previous task definition version in the event of a deployment failure or service degradation.

## Prerequisites

- AWS Console access with appropriate IAM permissions
- AWS CLI configured with necessary permissions
- Knowledge of the service and task definition to roll back

## Symptoms

Indicators that may require a rollback:
- Increased error rates after a deployment
- Service health check failures
- Performance degradation
- Functionality issues reported by users
- Abnormal CloudWatch metrics

## Procedure

### 1. Assess the Situation

1. Verify there's an actual problem requiring rollback:

```bash
# Check service events
aws ecs describe-services --cluster ofauto-cluster --services ofauto-service --query 'services[0].events[0:5]'

# Check service status
aws ecs describe-services --cluster ofauto-cluster --services ofauto-service --query 'services[0].status'
```

2. Check CloudWatch Alarms and Metrics
3. Review application logs for errors

### 2. Identify the Last Stable Version

1. List recent task definitions:

```bash
# Get current task definition
CURRENT_TD=$(aws ecs describe-services --cluster ofauto-cluster --services ofauto-service --query 'services[0].taskDefinition' --output text)
echo "Current task definition: $CURRENT_TD"

# List recent task definitions
aws ecs list-task-definitions --family-prefix ofauto-service --sort DESC --max-items 10
```

2. Identify the last known good version to roll back to (typically the version before the current one)

### 3. Prepare for Rollback

1. Notify the team via Slack in the #ops channel
   ```
   @here Rolling back ofauto-service to previous version due to [REASON]. Expect brief service disruption.
   ```

2. If possible, enable maintenance mode or route traffic away from the service

### 4. Execute the Rollback

#### Using AWS Console:
1. Navigate to ECS Dashboard
2. Select the `ofauto-cluster`
3. Select the `ofauto-service`
4. Choose "Update" 
5. Select the previous task definition revision
6. Choose an appropriate deployment configuration (typically "Rolling update")
7. Click "Update Service"

#### Using AWS CLI:
```bash
# Set the previous task definition ARN (replace with actual ARN)
PREVIOUS_TD="arn:aws:ecs:us-east-1:123456789012:task-definition/ofauto-service:123"

# Update the service to use the previous task definition
aws ecs update-service --cluster ofauto-cluster --service ofauto-service --task-definition $PREVIOUS_TD
```

### 5. Monitor the Rollback

1. Watch deployment progress:
   ```bash
   # Monitor deployment
   aws ecs describe-services --cluster ofauto-cluster --services ofauto-service --query 'services[0].deployments'
   ```

2. Monitor service health:
   ```bash
   # Check running tasks
   aws ecs list-tasks --cluster ofauto-cluster --service-name ofauto-service
   ```

3. Verify all tasks are using the correct task definition version

4. Monitor CloudWatch metrics during transition:
   - CPU and memory utilization
   - Service response times
   - Error rates

### 6. Verify Service Recovery

1. Verify the service is functioning correctly:
   ```bash
   # Check service health endpoint
   curl https://api.ofauto.com/health
   ```

2. Verify functionality through test cases:
   - Check core API endpoints
   - Test critical user flows
   - Verify metrics are returning to normal

### 7. Post-Rollback Tasks

1. Send an "all clear" notification to the team
   ```
   @here Rollback of ofauto-service completed successfully. Service is operating normally.
   ```

2. Document the incident:
   - What happened
   - Why rollback was necessary
   - Impact duration
   - Root cause (if known)

3. Create a ticket for fixing the issue in the problematic deployment

4. Schedule a post-mortem if necessary

## Monitoring the Deployment

Keep monitoring the service for at least 1 hour after rollback:
- Watch for any recurring issues
- Monitor resource utilization
- Check error rates
- Review application logs

## Contact Information

- DevOps team: #devops-support Slack channel
- AWS Support: Portal link in internal wiki
- On-call phone: +1-555-123-4567

## Related Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/update-service.html)
- [Internal ECS Documentation](https://wiki.internal/ofauto/ecs)
- [Monitoring Dashboard](https://monitoring.ofauto.com/dashboards/ecs) 