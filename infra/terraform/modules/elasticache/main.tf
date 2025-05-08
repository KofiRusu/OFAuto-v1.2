variable "name" {
  description = "Name to be used on all resources as prefix"
  type        = string
}

variable "subnet_ids" {
  description = "A list of VPC subnet IDs"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  type        = string
}

variable "node_type" {
  description = "The instance type of the Redis nodes"
  type        = string
  default     = "cache.t3.small"
}

variable "num_cache_nodes" {
  description = "The number of cache nodes"
  type        = number
  default     = 1
}

variable "parameter_group_name" {
  description = "The name of the parameter group to associate with this cache cluster"
  type        = string
  default     = "default.redis6.x"
}

variable "engine_version" {
  description = "The version number of the Redis cache engine"
  type        = string
  default     = "6.x"
}

variable "port" {
  description = "The port number on which each of the cache nodes accept connections"
  type        = number
  default     = 6379
}

variable "maintenance_window" {
  description = "Specifies the weekly time range for when maintenance on the cache cluster is performed"
  type        = string
  default     = "sun:05:00-sun:09:00"
}

variable "snapshot_window" {
  description = "The daily time range during which ElastiCache will take a daily snapshot of your node(s)"
  type        = string
  default     = "03:00-05:00"
}

variable "snapshot_retention_limit" {
  description = "The number of days for which ElastiCache will retain automatic cache cluster snapshots before deleting them"
  type        = number
  default     = 7
}

variable "tags" {
  description = "A mapping of tags to assign to the resource"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Environment name"
  type        = string
}

resource "aws_security_group" "redis" {
  name        = "${var.name}-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = var.port
    to_port     = var.port
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-redis-sg"
    },
  )
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name}-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_cluster" "this" {
  cluster_id           = "${var.name}-redis"
  engine               = "redis"
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = var.parameter_group_name
  engine_version       = var.engine_version
  port                 = var.port
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [aws_security_group.redis.id]
  maintenance_window   = var.maintenance_window
  snapshot_window      = var.snapshot_window
  snapshot_retention_limit = var.snapshot_retention_limit

  tags = merge(
    var.tags,
    {
      Environment = var.environment
    },
  )
}

output "redis_cluster_id" {
  description = "The ID of the ElastiCache Redis cluster"
  value       = aws_elasticache_cluster.this.id
}

output "redis_endpoint" {
  description = "The address of the endpoint for the primary node in the cache cluster"
  value       = aws_elasticache_cluster.this.cache_nodes.0.address
}

output "redis_port" {
  description = "The port number on which each of the cache nodes will accept connections"
  value       = aws_elasticache_cluster.this.cache_nodes.0.port
}

output "redis_security_group_id" {
  description = "The security group ID of the Redis cluster"
  value       = aws_security_group.redis.id
} 