provider "aws" {
  region = var.aws_region
}

terraform {
  backend "s3" {
    bucket         = "ofauto-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "ofauto-terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

locals {
  environment = "staging"
  name_prefix = "ofauto-${local.environment}"
  
  tags = {
    Project     = "OFAuto"
    Environment = local.environment
    ManagedBy   = "Terraform"
  }

  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  domain_name = "staging.ofauto.com"
}

# VPC
module "vpc" {
  source = "../../modules/vpc"

  name = local.name_prefix
  cidr = var.vpc_cidr
  azs  = local.availability_zones
  
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = local.tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-alb-sg"
    },
  )
}

# RDS
module "rds" {
  source = "../../modules/rds"

  identifier = "${local.name_prefix}-postgresql"
  engine     = "postgres"
  
  instance_class         = var.rds_instance_class
  allocated_storage      = var.rds_allocated_storage
  max_allocated_storage  = var.rds_max_allocated_storage
  
  db_name = "ofauto"
  username = "postgres"
  
  subnet_ids = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.database.id]
  
  multi_az = true
  backup_retention_period = 7
  
  environment = local.environment
  
  tags = local.tags
}

# Security Group for RDS
resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-db-sg"
  description = "Security group for RDS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [] # Will be updated with ECS security group
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-db-sg"
    },
  )
}

# ElastiCache
module "elasticache" {
  source = "../../modules/elasticache"

  name = local.name_prefix
  vpc_id = module.vpc.vpc_id
  vpc_cidr_block = var.vpc_cidr
  subnet_ids = module.vpc.private_subnets
  
  node_type = var.elasticache_node_type
  
  environment = local.environment
  tags = local.tags
}

# Vault for secrets management
module "vault" {
  source = "../../modules/vault"

  name = local.name_prefix
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  instance_type = var.vault_instance_type
  
  environment = local.environment
  tags = local.tags
}

# Update security groups with cross-references
resource "aws_security_group_rule" "ecs_to_db" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.database.id
  source_security_group_id = module.ecs.security_group_id
}

resource "aws_security_group_rule" "ecs_to_redis" {
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  security_group_id        = module.elasticache.redis_security_group_id
  source_security_group_id = module.ecs.security_group_id
}

# ALB
module "alb" {
  source = "../../modules/alb"

  name = local.name_prefix
  vpc_id = module.vpc.vpc_id
  subnets = module.vpc.public_subnets
  security_groups = [aws_security_group.alb.id]
  
  http_tcp_listeners = [
    {
      port               = 80
      protocol           = "HTTP"
      target_group_index = 0
      action_type        = "redirect"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]
  
  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = var.acm_certificate_arn
      target_group_index = 0
    }
  ]
  
  target_groups = [
    {
      name                 = "${local.name_prefix}-tg"
      backend_protocol     = "HTTP"
      backend_port         = 3000
      target_type          = "ip"
      deregistration_delay = 300
      health_check = {
        enabled             = true
        interval            = 30
        path                = "/api/health"
        port                = "traffic-port"
        healthy_threshold   = 3
        unhealthy_threshold = 3
        timeout             = 5
        protocol            = "HTTP"
        matcher             = "200"
      }
    }
  ]
  
  environment = local.environment
  tags = local.tags
}

# ECS
module "ecs" {
  source = "../../modules/ecs"

  name = local.name_prefix
  vpc_id = module.vpc.vpc_id
  subnets = module.vpc.private_subnets
  
  alb_security_group_id = aws_security_group.alb.id
  alb_target_group_arn = module.alb.target_group_arns[0]
  
  container_image = var.container_image
  container_port = 3000
  
  container_cpu = 1024
  container_memory = 2048
  task_cpu = 1024
  task_memory = 2048
  
  desired_count = 2
  min_capacity = 2
  max_capacity = 6
  
  environment_variables = [
    {
      name = "NODE_ENV",
      value = "production"
    },
    {
      name = "PORT",
      value = "3000"
    },
    {
      name = "DATABASE_URL",
      value = "postgresql://${module.rds.db_instance_username}:${module.rds.db_instance_password}@${module.rds.db_instance_endpoint}/${module.rds.db_instance_name}"
    },
    {
      name = "REDIS_URL",
      value = "redis://${module.elasticache.redis_endpoint}:${module.elasticache.redis_port}"
    },
    {
      name = "VAULT_ADDR",
      value = "http://${module.vault.vault_lb_dns_name}:443"
    }
  ]
  
  # Pass secrets from Vault to the ECS task
  secrets_manager_arn = aws_secretsmanager_secret.ofauto.arn
  
  enable_execute_command = true
  
  environment = local.environment
  tags = local.tags
}

# AWS Secrets Manager for ECS secrets
resource "aws_secretsmanager_secret" "ofauto" {
  name        = "${local.name_prefix}-secrets"
  description = "Secrets for OFAuto ${local.environment} environment"
  
  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "ofauto" {
  secret_id = aws_secretsmanager_secret.ofauto.id
  
  secret_string = jsonencode({
    CLERK_SECRET_KEY      = var.clerk_secret_key
    CLERK_PUBLISHABLE_KEY = var.clerk_publishable_key
    ENCRYPTION_KEY        = var.encryption_key
    OPENAI_API_KEY        = var.openai_api_key
  })
}

# Route53
module "route53" {
  source = "../../modules/route53"

  domain_name = var.root_domain_name
  subdomain   = local.environment
  create_zone = false
  zone_id     = var.hosted_zone_id
  
  alb_dns_name = module.alb.lb_dns_name
  alb_zone_id  = module.alb.lb_zone_id
  
  environment = local.environment
  tags = local.tags
}

# Output values
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = var.vpc_cidr
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "rds_endpoint" {
  description = "The endpoint of the database"
  value       = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  description = "The Redis endpoint"
  value       = "${module.elasticache.redis_endpoint}:${module.elasticache.redis_port}"
}

output "vault_endpoint" {
  description = "The Vault endpoint"
  value       = module.vault.vault_lb_dns_name
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = module.alb.lb_dns_name
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = module.ecs.service_name
}

output "fqdn" {
  description = "The fully qualified domain name"
  value       = module.route53.fqdn
} 