#!/bin/bash
set -e

# OFAuto - ECR Deployment Script
# This script builds Docker images and pushes them to Amazon ECR

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}             OFAuto ECR Deployment Script                  ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    echo -e "Please install AWS CLI with:"
    echo -e "  brew install awscli  # macOS"
    echo -e "  or follow instructions at https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo -e "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi

# Configuration (update these values)
AWS_REGION=${AWS_REGION:-"us-east-1"}
ECR_REPOSITORY_BACKEND=${ECR_REPOSITORY_BACKEND:-"ofauto-backend"}
ECR_REPOSITORY_FRONTEND=${ECR_REPOSITORY_FRONTEND:-"ofauto-frontend"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${YELLOW}Using the following configuration:${NC}"
echo -e "  AWS Region: ${AWS_REGION}"
echo -e "  Backend ECR Repository: ${ECR_REPOSITORY_BACKEND}"
echo -e "  Frontend ECR Repository: ${ECR_REPOSITORY_FRONTEND}"
echo -e "  Image Tag: ${IMAGE_TAG}"
echo

# Check if AWS is configured
echo -e "${BLUE}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured or does not have sufficient permissions.${NC}"
    echo -e "Please configure AWS CLI with:"
    echo -e "  aws configure"
    echo -e "And ensure you have permission to push to ECR."
    exit 1
fi
echo -e "${GREEN}AWS credentials verified.${NC}"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "AWS Account ID: ${AWS_ACCOUNT_ID}"

# Check if repositories exist, create them if they don't
echo -e "${BLUE}Checking if ECR repositories exist...${NC}"

# Backend repository
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY_BACKEND} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${YELLOW}Creating backend repository ${ECR_REPOSITORY_BACKEND}...${NC}"
    aws ecr create-repository --repository-name ${ECR_REPOSITORY_BACKEND} --region ${AWS_REGION}
    echo -e "${GREEN}Repository ${ECR_REPOSITORY_BACKEND} created.${NC}"
else
    echo -e "${GREEN}Repository ${ECR_REPOSITORY_BACKEND} exists.${NC}"
fi

# Frontend repository
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY_FRONTEND} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${YELLOW}Creating frontend repository ${ECR_REPOSITORY_FRONTEND}...${NC}"
    aws ecr create-repository --repository-name ${ECR_REPOSITORY_FRONTEND} --region ${AWS_REGION}
    echo -e "${GREEN}Repository ${ECR_REPOSITORY_FRONTEND} created.${NC}"
else
    echo -e "${GREEN}Repository ${ECR_REPOSITORY_FRONTEND} exists.${NC}"
fi

# Log in to ECR
echo -e "${BLUE}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo -e "${GREEN}Successfully logged in to ECR.${NC}"

# Build and push backend image
echo -e "${BLUE}Building backend image...${NC}"
if [ -d "./backend" ]; then
    BACKEND_DOCKERFILE="./backend/Dockerfile"
else
    BACKEND_DOCKERFILE="./Dockerfile"
fi

echo -e "Using Dockerfile at ${BACKEND_DOCKERFILE}"
docker build -t ${ECR_REPOSITORY_BACKEND}:${IMAGE_TAG} -f ${BACKEND_DOCKERFILE} .
echo -e "${GREEN}Backend image built successfully.${NC}"

echo -e "${BLUE}Tagging backend image...${NC}"
docker tag ${ECR_REPOSITORY_BACKEND}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}:${IMAGE_TAG}
echo -e "${GREEN}Backend image tagged successfully.${NC}"

echo -e "${BLUE}Pushing backend image to ECR...${NC}"
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}:${IMAGE_TAG}
echo -e "${GREEN}Backend image pushed successfully.${NC}"

# Build and push frontend image
echo -e "${BLUE}Building frontend image...${NC}"
if [ -d "./client" ]; then
    FRONTEND_DOCKERFILE="./client/Dockerfile"
else
    FRONTEND_DOCKERFILE="./Dockerfile"
fi

echo -e "Using Dockerfile at ${FRONTEND_DOCKERFILE}"
if [ -d "./client" ]; then
    docker build -t ${ECR_REPOSITORY_FRONTEND}:${IMAGE_TAG} -f ${FRONTEND_DOCKERFILE} ./client
else
    docker build -t ${ECR_REPOSITORY_FRONTEND}:${IMAGE_TAG} -f ${FRONTEND_DOCKERFILE} .
fi
echo -e "${GREEN}Frontend image built successfully.${NC}"

echo -e "${BLUE}Tagging frontend image...${NC}"
docker tag ${ECR_REPOSITORY_FRONTEND}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}:${IMAGE_TAG}
echo -e "${GREEN}Frontend image tagged successfully.${NC}"

echo -e "${BLUE}Pushing frontend image to ECR...${NC}"
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}:${IMAGE_TAG}
echo -e "${GREEN}Frontend image pushed successfully.${NC}"

echo -e "${BLUE}===========================================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo -e "Backend image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}:${IMAGE_TAG}"
echo -e "Frontend image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}:${IMAGE_TAG}"
echo -e "${BLUE}===========================================================${NC}" 