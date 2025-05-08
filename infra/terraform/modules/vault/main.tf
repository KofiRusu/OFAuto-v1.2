variable "name" {
  description = "Name to be used on all resources as prefix"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "A list of subnet IDs to deploy Vault in"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type for Vault server"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = null
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect to Vault"
  type        = list(string)
  default     = ["0.0.0.0/0"]
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

# Security group for Vault
resource "aws_security_group" "vault" {
  name        = "${var.name}-vault-sg"
  description = "Security group for Vault cluster"
  vpc_id      = var.vpc_id

  # HTTPS API
  ingress {
    from_port   = 8200
    to_port     = 8200
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Vault cluster
  ingress {
    from_port   = 8201
    to_port     = 8201
    protocol    = "tcp"
    self        = true
  }

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
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
      Name = "${var.name}-vault-sg"
    },
  )
}

# IAM role for Vault
resource "aws_iam_role" "vault" {
  name = "${var.name}-vault-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-vault-role"
    },
  )
}

# IAM policy for KMS auto-unseal
resource "aws_iam_policy" "vault_kms" {
  name        = "${var.name}-vault-kms-policy"
  description = "Policy to allow Vault to use KMS for auto-unseal"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.vault_unseal.arn
      }
    ]
  })
}

# Attach KMS policy to role
resource "aws_iam_role_policy_attachment" "vault_kms" {
  role       = aws_iam_role.vault.name
  policy_arn = aws_iam_policy.vault_kms.arn
}

# IAM instance profile
resource "aws_iam_instance_profile" "vault" {
  name = "${var.name}-vault-instance-profile"
  role = aws_iam_role.vault.name
}

# KMS key for auto-unseal
resource "aws_kms_key" "vault_unseal" {
  description             = "KMS key for Vault auto-unseal"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-vault-unseal-key"
    },
  )
}

resource "aws_kms_alias" "vault_unseal" {
  name          = "alias/${var.name}-vault-unseal"
  target_key_id = aws_kms_key.vault_unseal.key_id
}

# User data template for Vault configuration
locals {
  vault_user_data = <<-EOF
#!/bin/bash
# Install required packages
apt-get update
apt-get install -y unzip jq

# Download and install Vault
curl -fsSL https://releases.hashicorp.com/vault/1.13.0/vault_1.13.0_linux_amd64.zip -o vault.zip
unzip vault.zip
mv vault /usr/local/bin/
chmod +x /usr/local/bin/vault

# Create Vault user
useradd --system --home /etc/vault.d --shell /bin/false vault

# Create Vault configuration directory
mkdir -p /etc/vault.d
chmod 750 /etc/vault.d

# Create Vault data directory
mkdir -p /var/lib/vault
chmod 750 /var/lib/vault
chown -R vault:vault /var/lib/vault

# Create Vault configuration
cat > /etc/vault.d/vault.hcl << 'VAULTCONF'
ui = true

storage "file" {
  path = "/var/lib/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # For demo only, use proper TLS in production
}

seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "${aws_kms_key.vault_unseal.key_id}"
}

api_addr     = "http://$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4):8200"
cluster_addr = "http://$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4):8201"
VAULTCONF

# Set proper permissions
chown -R vault:vault /etc/vault.d
chmod 640 /etc/vault.d/vault.hcl

# Create systemd service file
cat > /etc/systemd/system/vault.service << 'VAULTSVC'
[Unit]
Description=Vault server
Documentation=https://www.vaultproject.io/docs/
Requires=network-online.target
After=network-online.target

[Service]
User=vault
Group=vault
ProtectSystem=full
ProtectHome=read-only
PrivateTmp=yes
PrivateDevices=yes
SecureBits=keep-caps
AmbientCapabilities=CAP_IPC_LOCK
NoNewPrivileges=yes
ExecStart=/usr/local/bin/vault server -config=/etc/vault.d/vault.hcl
ExecReload=/bin/kill --signal HUP $MAINPID
KillMode=process
KillSignal=SIGINT
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
StartLimitInterval=60
StartLimitBurst=3
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
VAULTSVC

# Enable and start Vault service
systemctl daemon-reload
systemctl enable vault
systemctl start vault

# Set environment variables
echo "export VAULT_ADDR=http://127.0.0.1:8200" >> /etc/bashrc
echo "export VAULT_ADDR=http://127.0.0.1:8200" >> /etc/profile.d/vault.sh

# Initialize Vault when it's ready
sleep 15
vault_status=$(curl -s http://127.0.0.1:8200/v1/sys/health | jq -r '.initialized')
if [ "$vault_status" = "false" ]; then
  # Initialize Vault
  vault_init=$(VAULT_ADDR=http://127.0.0.1:8200 vault operator init -format=json)
  
  # Save keys securely (in a real environment, store these securely)
  echo "$vault_init" > /root/vault-init.json
  chmod 600 /root/vault-init.json
  
  # Optional: Create a simplified version with just the root token
  root_token=$(echo "$vault_init" | jq -r '.root_token')
  echo "$root_token" > /root/vault-root-token.txt
  chmod 600 /root/vault-root-token.txt
fi

# Mark as complete
touch /tmp/vault-setup-complete
EOF
}

# Launch template for Vault
resource "aws_launch_template" "vault" {
  name_prefix            = "${var.name}-vault-"
  image_id               = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS (adjust for your region)
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.vault.id]
  user_data              = base64encode(local.vault_user_data)
  
  iam_instance_profile {
    name = aws_iam_instance_profile.vault.name
  }
  
  block_device_mappings {
    device_name = "/dev/sda1"
    
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }
  
  tag_specifications {
    resource_type = "instance"
    
    tags = merge(
      var.tags,
      {
        Name = "${var.name}-vault-server"
      },
    )
  }
  
  tag_specifications {
    resource_type = "volume"
    
    tags = merge(
      var.tags,
      {
        Name = "${var.name}-vault-volume"
      },
    )
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
}

# Auto Scaling Group for Vault
resource "aws_autoscaling_group" "vault" {
  name                = "${var.name}-vault-asg"
  min_size            = 1
  max_size            = 1
  desired_capacity    = 1
  vpc_zone_identifier = var.subnet_ids
  
  launch_template {
    id      = aws_launch_template.vault.id
    version = "$Latest"
  }
  
  health_check_type         = "EC2"
  health_check_grace_period = 300
  
  termination_policies      = ["OldestInstance"]
  
  dynamic "tag" {
    for_each = merge(
      var.tags,
      {
        Name = "${var.name}-vault-server"
      },
    )
    
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Load balancer security group
resource "aws_security_group" "vault_lb" {
  name        = "${var.name}-vault-lb-sg"
  description = "Security group for Vault load balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
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
      Name = "${var.name}-vault-lb-sg"
    },
  )
}

# Network load balancer
resource "aws_lb" "vault" {
  name               = "${var.name}-vault-lb"
  internal           = true
  load_balancer_type = "network"
  subnets            = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-vault-lb"
    },
  )
}

# Target group
resource "aws_lb_target_group" "vault" {
  name     = "${var.name}-vault-tg"
  port     = 8200
  protocol = "TCP"
  vpc_id   = var.vpc_id
  
  health_check {
    protocol = "HTTP"
    path     = "/v1/sys/health"
    port     = "traffic-port"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-vault-tg"
    },
  )
}

# Load balancer listener
resource "aws_lb_listener" "vault" {
  load_balancer_arn = aws_lb.vault.arn
  port              = 443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.vault.arn
  }
}

# Auto Scaling Group attachment
resource "aws_autoscaling_attachment" "vault" {
  autoscaling_group_name = aws_autoscaling_group.vault.name
  lb_target_group_arn    = aws_lb_target_group.vault.arn
}

# ECS Task IAM Policy for Vault access
resource "aws_iam_policy" "ecs_vault_access" {
  name        = "${var.name}-ecs-vault-access"
  description = "Policy allowing ECS tasks to access Vault"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

# Vault policy for ECS tasks (to be created by Vault admin)
locals {
  ecs_policy = <<-EOF
# Allow ECS tasks to read secrets
path "secret/data/ofauto/*" {
  capabilities = ["read"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow token lookup for verification
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
EOF
}

output "vault_lb_dns_name" {
  description = "The DNS name of the Vault load balancer"
  value       = aws_lb.vault.dns_name
}

output "vault_sg_id" {
  description = "The ID of the Vault security group"
  value       = aws_security_group.vault.id
}

output "kms_key_id" {
  description = "The ID of the KMS key used for Vault auto-unseal"
  value       = aws_kms_key.vault_unseal.key_id
}

output "ecs_vault_policy_arn" {
  description = "The ARN of the IAM policy for ECS tasks to access Vault"
  value       = aws_iam_policy.ecs_vault_access.arn
}

output "suggested_vault_policy" {
  description = "A suggested Vault policy for ECS tasks"
  value       = local.ecs_policy
} 