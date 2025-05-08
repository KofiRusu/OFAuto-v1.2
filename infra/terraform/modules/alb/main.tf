variable "name" {
  description = "Name to be used on all resources as prefix"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnets" {
  description = "A list of subnets to associate with the ALB"
  type        = list(string)
}

variable "security_groups" {
  description = "A list of security group IDs to assign to the ALB"
  type        = list(string)
  default     = []
}

variable "http_tcp_listeners" {
  description = "A list of maps describing the HTTP listeners"
  type        = list(map(string))
  default     = []
}

variable "https_listeners" {
  description = "A list of maps describing the HTTPS listeners"
  type        = list(map(string))
  default     = []
}

variable "target_groups" {
  description = "A list of maps containing target group configuration"
  type        = any
  default     = []
}

variable "enable_deletion_protection" {
  description = "If true, deletion of the load balancer will be disabled via the AWS API"
  type        = bool
  default     = true
}

variable "access_logs" {
  description = "Map containing access logging configuration for load balancer"
  type        = map(string)
  default     = {}
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

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 8.0"

  name = var.name

  load_balancer_type = "application"

  vpc_id          = var.vpc_id
  subnets         = var.subnets
  security_groups = var.security_groups

  http_tcp_listeners = var.http_tcp_listeners
  https_listeners    = var.https_listeners
  target_groups      = var.target_groups

  enable_deletion_protection = var.enable_deletion_protection

  access_logs = var.access_logs

  tags = merge(
    var.tags,
    {
      Environment = var.environment
    },
  )
}

output "lb_id" {
  description = "The ID and ARN of the load balancer"
  value       = module.alb.lb_id
}

output "lb_arn" {
  description = "The ID and ARN of the load balancer"
  value       = module.alb.lb_arn
}

output "lb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = module.alb.lb_dns_name
}

output "lb_zone_id" {
  description = "The zone_id of the load balancer to assist with creating DNS records"
  value       = module.alb.lb_zone_id
}

output "target_group_arns" {
  description = "List of target group ARNs"
  value       = module.alb.target_group_arns
}

output "target_group_names" {
  description = "List of target group names"
  value       = module.alb.target_group_names
}

output "http_tcp_listener_arns" {
  description = "The ARN of the HTTP listener"
  value       = module.alb.http_tcp_listener_arns
}

output "https_listener_arns" {
  description = "The ARN of the HTTPS listener"
  value       = module.alb.https_listener_arns
}

output "security_group_id" {
  description = "The security group ID of the ALB"
  value       = module.alb.security_group_id
} 