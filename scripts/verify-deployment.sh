#!/bin/bash

# OFAuto Deployment Verification Script
# This script verifies the deployed infrastructure for OFAuto

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get environment from arguments
ENVIRONMENT="staging"
if [ "$1" != "" ]; then
    ENVIRONMENT=$1
fi

echo -e "${BLUE}=== OFAuto Deployment Verification for ${ENVIRONMENT} ===${NC}"

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it and try again.${NC}"
    exit 1
fi

# Check AWS credentials
echo -e "\n${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials not configured or invalid. Please run 'aws configure' and try again.${NC}"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
echo -e "✅ AWS credentials valid for account ${ACCOUNT_ID}"

# Verify VPC
echo -e "\n${YELLOW}Verifying VPC...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=ofauto-${ENVIRONMENT}-vpc" --query "Vpcs[0].VpcId" --output text)
if [ "$VPC_ID" == "None" ] || [ "$VPC_ID" == "" ]; then
    echo -e "${RED}❌ VPC not found${NC}"
else
    echo -e "✅ VPC found: ${VPC_ID}"
    
    # Verify subnets
    echo -e "\n${YELLOW}Verifying subnets...${NC}"
    SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query "length(Subnets)" --output text)
    echo -e "✅ Found ${SUBNET_COUNT} subnets in VPC ${VPC_ID}"
fi

# Verify RDS
echo -e "\n${YELLOW}Verifying RDS instance...${NC}"
RDS_STATUS=$(aws rds describe-db-instances --filters "Name=tag:Environment,Values=${ENVIRONMENT}" --query "DBInstances[?DBInstanceIdentifier=='ofauto-${ENVIRONMENT}-db'].DBInstanceStatus" --output text)
if [ "$RDS_STATUS" == "" ]; then
    echo -e "${RED}❌ RDS instance not found${NC}"
else
    echo -e "✅ RDS instance found with status: ${RDS_STATUS}"
    
    # Check Multi-AZ
    MULTI_AZ=$(aws rds describe-db-instances --filters "Name=tag:Environment,Values=${ENVIRONMENT}" --query "DBInstances[?DBInstanceIdentifier=='ofauto-${ENVIRONMENT}-db'].MultiAZ" --output text)
    if [ "$MULTI_AZ" == "True" ]; then
        echo -e "✅ RDS Multi-AZ is enabled"
    else
        echo -e "${YELLOW}⚠️ RDS Multi-AZ is disabled${NC}"
    fi
fi

# Verify ElastiCache
echo -e "\n${YELLOW}Verifying ElastiCache...${NC}"
CACHE_STATUS=$(aws elasticache describe-cache-clusters --query "CacheClusters[?contains(CacheClusterId, 'ofauto-${ENVIRONMENT}')].CacheClusterStatus" --output text)
if [ "$CACHE_STATUS" == "" ]; then
    echo -e "${RED}❌ ElastiCache cluster not found${NC}"
else
    echo -e "✅ ElastiCache cluster found with status: ${CACHE_STATUS}"
fi

# Verify ECS
echo -e "\n${YELLOW}Verifying ECS cluster...${NC}"
ECS_STATUS=$(aws ecs describe-clusters --clusters "ofauto-${ENVIRONMENT}" --query "clusters[0].status" --output text)
if [ "$ECS_STATUS" == "" ] || [ "$ECS_STATUS" == "None" ]; then
    echo -e "${RED}❌ ECS cluster not found${NC}"
else
    echo -e "✅ ECS cluster found with status: ${ECS_STATUS}"
    
    # Check ECS service
    SERVICE_STATUS=$(aws ecs describe-services --cluster "ofauto-${ENVIRONMENT}" --services "ofauto-${ENVIRONMENT}-service" --query "services[0].status" --output text 2>/dev/null || echo "")
    if [ "$SERVICE_STATUS" == "" ] || [ "$SERVICE_STATUS" == "None" ]; then
        echo -e "${RED}❌ ECS service not found${NC}"
    else
        echo -e "✅ ECS service found with status: ${SERVICE_STATUS}"
        
        # Check running tasks
        RUNNING_TASKS=$(aws ecs list-tasks --cluster "ofauto-${ENVIRONMENT}" --service-name "ofauto-${ENVIRONMENT}-service" --desired-status RUNNING --query "length(taskArns)" --output text 2>/dev/null || echo "0")
        echo -e "✅ ECS service has ${RUNNING_TASKS} running tasks"
    fi
fi

# Verify Load Balancer
echo -e "\n${YELLOW}Verifying Load Balancer...${NC}"
ALB_ARN=$(aws elbv2 describe-load-balancers --names "ofauto-${ENVIRONMENT}-alb" --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "")
if [ "$ALB_ARN" == "" ] || [ "$ALB_ARN" == "None" ]; then
    echo -e "${RED}❌ Load balancer not found${NC}"
else
    echo -e "✅ Load balancer found"
    
    # Check target groups
    TARGET_GROUPS=$(aws elbv2 describe-target-groups --load-balancer-arn "$ALB_ARN" --query "length(TargetGroups)" --output text)
    echo -e "✅ Load balancer has ${TARGET_GROUPS} target groups"
    
    # Check health of targets
    HEALTHY_TARGETS=$(aws elbv2 describe-target-groups --load-balancer-arn "$ALB_ARN" --query "TargetGroups[0].TargetGroupArn" --output text | xargs -I {} aws elbv2 describe-target-health --target-group-arn {} --query "length(TargetHealthDescriptions[?TargetHealth.State=='healthy'])" --output text 2>/dev/null || echo "0")
    TOTAL_TARGETS=$(aws elbv2 describe-target-groups --load-balancer-arn "$ALB_ARN" --query "TargetGroups[0].TargetGroupArn" --output text | xargs -I {} aws elbv2 describe-target-health --target-group-arn {} --query "length(TargetHealthDescriptions)" --output text 2>/dev/null || echo "0")
    
    if [ "$TOTAL_TARGETS" == "0" ]; then
        echo -e "${YELLOW}⚠️ No targets registered with target group${NC}"
    else
        echo -e "✅ ${HEALTHY_TARGETS}/${TOTAL_TARGETS} targets are healthy"
    fi
fi

# Verify Route53
echo -e "\n${YELLOW}Verifying Route53 DNS...${NC}"
DOMAIN="ofauto.yourdomain.com" # Replace with actual domain
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[0].Id" --output text 2>/dev/null || echo "")

if [ "$HOSTED_ZONE_ID" == "" ] || [ "$HOSTED_ZONE_ID" == "None" ]; then
    echo -e "${YELLOW}⚠️ No hosted zones found${NC}"
else
    echo -e "✅ Hosted zone found: ${HOSTED_ZONE_ID}"
    
    # Check for A record
    DNS_RECORDS=$(aws route53 list-resource-record-sets --hosted-zone-id "${HOSTED_ZONE_ID//\/hostedzone\//}" --query "ResourceRecordSets[?Name=='${DOMAIN}.'].Type" --output text 2>/dev/null || echo "")
    
    if [[ "$DNS_RECORDS" == *"A"* ]]; then
        echo -e "✅ DNS A record exists for ${DOMAIN}"
    else
        echo -e "${YELLOW}⚠️ No DNS A record found for ${DOMAIN}${NC}"
    fi
fi

# Verify Vault
echo -e "\n${YELLOW}Verifying Vault...${NC}"
if [ -z "$VAULT_ADDR" ]; then
    echo -e "${YELLOW}⚠️ VAULT_ADDR environment variable not set${NC}"
else
    VAULT_STATUS=$(curl -s "${VAULT_ADDR}/v1/sys/health" 2>/dev/null | grep -o '"initialized":true' || echo "")
    if [ "$VAULT_STATUS" == "" ]; then
        echo -e "${RED}❌ Vault is not accessible or not initialized${NC}"
    else
        echo -e "✅ Vault is initialized and accessible"
        
        # Check Vault auth methods if VAULT_TOKEN is set
        if [ -n "$VAULT_TOKEN" ]; then
            AUTH_METHODS=$(curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" "${VAULT_ADDR}/v1/sys/auth" 2>/dev/null | grep -o '"aws/"' || echo "")
            if [[ "$AUTH_METHODS" == *"aws"* ]]; then
                echo -e "✅ AWS auth method enabled in Vault"
            else
                echo -e "${YELLOW}⚠️ AWS auth method not found in Vault${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️ VAULT_TOKEN not set, skipping auth methods check${NC}"
        fi
    fi
fi

# Summary
echo -e "\n${BLUE}=== Verification Summary ===${NC}"
echo -e "Environment: ${ENVIRONMENT}"
echo -e "AWS Account: ${ACCOUNT_ID}"
echo -e "VPC: ${VPC_ID:-Not Found}"
echo -e "RDS Status: ${RDS_STATUS:-Not Found}"
echo -e "ElastiCache Status: ${CACHE_STATUS:-Not Found}"
echo -e "ECS Cluster Status: ${ECS_STATUS:-Not Found}"
echo -e "ECS Running Tasks: ${RUNNING_TASKS:-0}"
echo -e "Load Balancer: ${ALB_ARN:+Found}"
echo -e "Healthy Targets: ${HEALTHY_TARGETS:-0}/${TOTAL_TARGETS:-0}"
echo -e "DNS Configuration: ${DNS_RECORDS:+Configured}"
echo -e "Vault Status: ${VAULT_STATUS:+Healthy}"

echo -e "\n${GREEN}Verification complete!${NC}" 