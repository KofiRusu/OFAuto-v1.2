#!/bin/bash
set -e

# Configuration variables
ECR_REPOSITORY="ofauto-ui"
AWS_REGION="us-east-1"  # Change this to your AWS region if different
DOCKERFILE_PATH="."
IMAGE_TAG="latest"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Login to AWS ECR
login_to_ecr() {
    log "${YELLOW}Logging in to Amazon ECR...${NC}"
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query 'Account' --output text).dkr.ecr.$AWS_REGION.amazonaws.com
}

# Create repository if it doesn't exist
create_repository() {
    log "${YELLOW}Checking if repository exists...${NC}"
    if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null; then
        log "${YELLOW}Creating ECR repository...${NC}"
        aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
    else
        log "${YELLOW}Repository already exists.${NC}"
    fi
}

# Build and tag the Docker image
build_image() {
    log "${YELLOW}Building Docker image...${NC}"
    docker build -t $ECR_REPOSITORY:$IMAGE_TAG $DOCKERFILE_PATH
}

# Push the image to ECR
push_image() {
    log "${YELLOW}Tagging image for ECR...${NC}"
    REGISTRY_URL=$(aws sts get-caller-identity --query 'Account' --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    docker tag $ECR_REPOSITORY:$IMAGE_TAG $REGISTRY_URL/$ECR_REPOSITORY:$IMAGE_TAG
    
    log "${YELLOW}Pushing image to ECR...${NC}"
    docker push $REGISTRY_URL/$ECR_REPOSITORY:$IMAGE_TAG
    
    log "${GREEN}Successfully pushed image: $REGISTRY_URL/$ECR_REPOSITORY:$IMAGE_TAG${NC}"
    echo "$REGISTRY_URL/$ECR_REPOSITORY:$IMAGE_TAG" > .last_image_uri
}

# Main execution
main() {
    login_to_ecr
    create_repository
    build_image
    push_image
    log "${GREEN}Deployment preparation complete!${NC}"
    log "${YELLOW}Next steps: Update Terraform ECS task definition with the new image URI${NC}"
}

main 