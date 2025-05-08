# UserInterfaceHub Deployment Guide

This document provides instructions for deploying the UserInterfaceHub to AWS ECS Fargate and integrating it with the existing OFAuto infrastructure.

## Overview

The UserInterfaceHub is deployed as a containerized application to AWS ECS Fargate. The deployment process includes:

1. Building a Docker image
2. Pushing the image to Amazon ECR
3. Updating the Terraform ECS task definition
4. Deploying to ECS Fargate
5. Configuring ALB with TLS
6. Running smoke tests

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed locally
- Terraform v1.4.6+
- Node.js v18+

## Manual Deployment Process

To manually deploy the UserInterfaceHub:

1. **Build and push Docker image to ECR**:

```bash
npm run deploy:ui
```

This script:
- Logs in to AWS ECR
- Creates the ECR repository if it doesn't exist
- Builds the Docker image
- Tags the image with the latest tag
- Pushes the image to ECR

2. **Update Terraform configuration**:

The ECR image URI is saved to `.last_image_uri` file after running the deployment script. Use this URI to update the Terraform variables:

```bash
cd infra/terraform/environments/[environment]
terraform init
terraform plan -var="ui_container_image=$(cat ../../../../.last_image_uri)" -out=tfplan-ui
terraform apply tfplan-ui
```

3. **Run smoke tests**:

```bash
npm run test:smoke -- --url=https://[your-deployment-domain]
```

## CI/CD Pipeline

The UI deployment is automated through GitHub Actions. The workflow is defined in `.github/workflows/ui-cd.yml` and includes:

1. Building and pushing the Docker image to ECR
2. Running Terraform plan and apply
3. Executing smoke tests
4. Sending notifications on failure

The pipeline is triggered on:
- Pushes to main/production branches that modify files in the UserInterfaceHub directory
- Manual workflow dispatch

## Architecture

### Container Configuration

The UserInterfaceHub is containerized using a multi-stage Docker build:
- Base stage: Installs dependencies and builds the application
- Production stage: Copies only the necessary files to minimize image size

### ECS Configuration

The ECS service is configured with:
- Fargate launch type for serverless operation
- Health checks to ensure container availability
- Auto-scaling based on CPU and memory usage
- TLS termination at the ALB level

### Security

The deployment includes:
- HTTPS-only access through the ALB
- Security groups limiting access to the ECS tasks
- IAM roles with minimal required permissions
- Secrets management for sensitive configuration

## Troubleshooting

Common issues and solutions:

1. **Container fails health checks**:
   - Check the CloudWatch logs for the ECS task
   - Verify the health check endpoint is responding correctly

2. **TLS certificate issues**:
   - Ensure the ACM certificate is valid and correctly referenced in Terraform

3. **ECR push failures**:
   - Confirm AWS credentials are configured correctly
   - Check ECR repository permissions

## Rollback Procedure

To rollback to a previous version:

1. Find the previous image tag in ECR
2. Update the Terraform variable with the previous image URI
3. Apply the Terraform configuration

```bash
terraform apply -var="ui_container_image=[previous-image-uri]"
``` 