#!/bin/bash
set -e

# OFAuto - Main App ECR Deployment Script
# This script builds the main OFAuto Docker image and pushes it to Amazon ECR

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}         OFAuto Main App ECR Deployment Script             ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Configuration (edit these values as needed)
AWS_REGION=${AWS_REGION:-"us-east-1"}
ECR_REPOSITORY=${ECR_REPOSITORY:-"ofauto"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${YELLOW}Using the following configuration:${NC}"
echo -e "  AWS Region: ${AWS_REGION}"
echo -e "  ECR Repository: ${ECR_REPOSITORY}"
echo -e "  Image Tag: ${IMAGE_TAG}"
echo

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    echo -e "Install the AWS CLI with: brew install awscli (macOS)"
    echo -e "or follow instructions at: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo -e "Install Docker from: https://www.docker.com/get-started"
    exit 1
fi

# Authenticate with AWS
echo -e "${BLUE}Authenticating with AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI not configured with valid credentials.${NC}"
    echo -e "Run 'aws configure' to set up your AWS credentials."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "AWS Account ID: ${AWS_ACCOUNT_ID}"

# Create ECR repository if it doesn't exist
echo -e "${BLUE}Checking if ECR repository exists...${NC}"
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${YELLOW}Creating ECR repository ${ECR_REPOSITORY}...${NC}"
    aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}
    echo -e "${GREEN}Repository created successfully.${NC}"
else
    echo -e "${GREEN}Repository already exists.${NC}"
fi

# Login to ECR
echo -e "${BLUE}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo -e "${GREEN}Login successful.${NC}"

# Build the Docker image
echo -e "${BLUE}Building Docker image...${NC}"
docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} -f Dockerfile .
echo -e "${GREEN}Docker image built successfully.${NC}"

# Tag the image for ECR
echo -e "${BLUE}Tagging image for ECR...${NC}"
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}
echo -e "${GREEN}Image tagged successfully.${NC}"

# Push the image to ECR
echo -e "${BLUE}Pushing image to ECR...${NC}"
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}
echo -e "${GREEN}Image pushed successfully.${NC}"

# Add a timestamp tag for versioning
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo -e "${BLUE}Adding timestamp tag (${TIMESTAMP})...${NC}"
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${TIMESTAMP}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${TIMESTAMP}
echo -e "${GREEN}Timestamp tag added and pushed.${NC}"

echo -e "${BLUE}===========================================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo -e "Image URI: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
echo -e "Versioned Image URI: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${TIMESTAMP}"
echo -e "${BLUE}===========================================================${NC}" 