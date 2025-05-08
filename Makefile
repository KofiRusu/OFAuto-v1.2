.PHONY: build-docker run-docker push-ecr clean-docker build-simple run-simple

# Docker image name and tag
IMAGE_NAME=ofauto
TAG=local

# AWS ECR settings
AWS_REGION?=eu-west-1
ECR_REPO?=ofauto
ECR_TAG?=latest

# Build Docker image
build-docker:
	@echo "Building Docker image $(IMAGE_NAME):$(TAG)..."
	docker build -t $(IMAGE_NAME):$(TAG) .

# Build Docker image using the simplified Dockerfile
build-simple:
	@echo "Building simplified Docker image $(IMAGE_NAME):$(TAG)..."
	docker build -t $(IMAGE_NAME):$(TAG) -f Dockerfile.simple .

# Run Docker container locally
run-docker: build-docker
	@echo "Running Docker container on port 3000..."
	docker run -p 3000:3000 --env-file .env $(IMAGE_NAME):$(TAG)

# Run Docker container locally with simplified version
run-simple: build-simple
	@echo "Running simplified Docker container on port 3000..."
	docker run -p 3000:3000 --env-file .env $(IMAGE_NAME):$(TAG)

# Clean Docker images
clean-docker:
	@echo "Cleaning Docker images..."
	@docker images | grep $(IMAGE_NAME) | awk '{print $$3}' | xargs -r docker rmi -f

# Get AWS account ID 
aws-account-id:
	@aws sts get-caller-identity --query Account --output text

# Push to ECR (requires AWS CLI and proper credentials)
push-ecr: build-simple
	@echo "Logging in to Amazon ECR..."
	@aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(AWS_REGION).amazonaws.com
	
	@echo "Tagging Docker image for ECR..."
	@docker tag $(IMAGE_NAME):$(TAG) $$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(AWS_REGION).amazonaws.com/$(ECR_REPO):$(ECR_TAG)
	
	@echo "Pushing to ECR..."
	@docker push $$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(AWS_REGION).amazonaws.com/$(ECR_REPO):$(ECR_TAG)

# Print help message
help:
	@echo "Available targets:"
	@echo "  build-docker    - Build Docker image using standard Dockerfile"
	@echo "  build-simple    - Build Docker image using simplified Dockerfile"
	@echo "  run-docker      - Run standard Docker container locally"
	@echo "  run-simple      - Run simplified Docker container locally"
	@echo "  clean-docker    - Remove Docker images"
	@echo "  push-ecr        - Push to Amazon ECR (requires AWS CLI and credentials)"
	@echo "  aws-account-id  - Get your AWS account ID"
	@echo "  help            - Show this help message"
	@echo ""
	@echo "Environment variables:"
	@echo "  IMAGE_NAME      - Docker image name (default: ofauto)"
	@echo "  TAG             - Docker image tag (default: local)"
	@echo "  AWS_REGION      - AWS region (default: eu-west-1)"
	@echo "  ECR_REPO        - ECR repository name (default: ofauto)"
	@echo "  ECR_TAG         - ECR image tag (default: latest)"

# Default target
.DEFAULT_GOAL := help 