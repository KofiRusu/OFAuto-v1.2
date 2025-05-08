variable "domain_name" {
  description = "The domain name"
  type        = string
}

variable "subdomain" {
  description = "The subdomain name (optional)"
  type        = string
  default     = ""
}

variable "create_zone" {
  description = "Whether to create Route53 zone"
  type        = bool
  default     = true
}

variable "zone_id" {
  description = "ID of the hosted zone to contain this record (or specify `domain_name`)"
  type        = string
  default     = null
}

variable "records" {
  description = "List of maps containing record configuration"
  type        = list(map(string))
  default     = []
}

variable "alb_dns_name" {
  description = "DNS name of the ALB"
  type        = string
  default     = null
}

variable "alb_zone_id" {
  description = "Zone ID of the ALB"
  type        = string
  default     = null
}

variable "tags" {
  description = "A mapping of tags to assign to all resources"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Environment name"
  type        = string
}

resource "aws_route53_zone" "this" {
  count = var.create_zone ? 1 : 0

  name = var.domain_name

  tags = merge(
    var.tags,
    {
      Environment = var.environment
    },
  )
}

locals {
  zone_id = var.create_zone ? aws_route53_zone.this[0].zone_id : var.zone_id
  fqdn    = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
}

resource "aws_route53_record" "alb" {
  count = var.alb_dns_name != null && var.alb_zone_id != null ? 1 : 0

  zone_id = local.zone_id
  name    = local.fqdn
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "this" {
  count = length(var.records)

  zone_id = local.zone_id
  name    = lookup(var.records[count.index], "name", null)
  type    = lookup(var.records[count.index], "type", null)
  ttl     = lookup(var.records[count.index], "ttl", 300)
  records = split(",", lookup(var.records[count.index], "records", null))
}

output "zone_id" {
  description = "The Route53 zone ID"
  value       = local.zone_id
}

output "name_servers" {
  description = "Name servers of the created zone"
  value       = var.create_zone ? aws_route53_zone.this[0].name_servers : null
}

output "fqdn" {
  description = "The fully qualified domain name"
  value       = local.fqdn
} 