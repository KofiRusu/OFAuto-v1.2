# OFAuto AWS Lambda Deployment Guide

This guide explains how to deploy OFAuto to AWS Lambda and Amazon ECR for containerized workloads.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository access
- AWS CLI installed locally (optional for manual deployments)

## Setup Instructions

### 1. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID` - Your AWS access key 
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - The AWS region (e.g., eu-west-1)
- `AWS_LAMBDA_ROLE_ARN` - The ARN of an IAM role with Lambda execution permissions

To add these secrets:
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add each secret

### 2. IAM Role Setup

The Lambda function requires an IAM role with these permissions:
- AWSLambdaBasicExecutionRole
- ECR access permissions

If you need to create a new role:
1. Go to IAM in AWS Console
2. Create a new role for Lambda
3. Attach the AWSLambdaBasicExecutionRole policy
4. Add a custom policy for ECR access if needed

### 3. Deployment Process

#### Automated Deployment

The repository contains two GitHub Action workflows:

1. **Pull Request Preview** (.github/workflows/preview.yml)
   - Triggered on pull request events
   - Builds and deploys to a PR-specific Lambda function
   - Pushes Docker image to ECR with PR-specific tag
   - Posts preview URL as comment on PR

2. **Production Deployment** (.github/workflows/production.yml)
   - Triggered when code is pushed to main branch
   - Builds and deploys to production Lambda function
   - Pushes Docker image to ECR with latest tag

#### Manual Deployment

For manual deployment:

1. Use the script in `scripts/deploy-main-to-ecr.sh` to deploy the main container:
   ```bash
   # Configure environment variables
   export AWS_REGION=eu-west-1
   export ECR_REPOSITORY=ofauto
   
   # Run the deployment script
   ./scripts/deploy-main-to-ecr.sh
   ```

2. Use AWS CLI to update the Lambda function:
   ```bash
   aws lambda update-function-code \
     --function-name ofauto-production \
     --zip-file fileb://lambda-deployment.zip
   ```

## Architecture

The deployment architecture includes:

- **AWS Lambda** - Hosts the Next.js application using a custom handler
- **Amazon ECR** - Stores Docker images for container execution
- **Lambda Function URL** - Provides HTTP endpoint for the application

## Troubleshooting

Common issues:

1. **Missing permissions**: Ensure the IAM role has appropriate permissions
2. **Lambda timeout**: Adjust timeout settings in the Lambda configuration
3. **ECR login failure**: Verify AWS credentials are correct

## Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Amazon ECR Documentation](https://docs.aws.amazon.com/ecr/) 