# AWS IAM Setup for OFAuto CI/CD

This document describes how to set up AWS IAM for the CI/CD pipeline with least-privilege access.

## Creating the CI/CD IAM Role

### Step 1: Create a Custom Policy for Terraform State Access

1. Go to IAM > Policies > Create policy
2. Create a policy with the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::ofauto-terraform-state",
        "arn:aws:s3:::ofauto-terraform-state/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/ofauto-terraform-locks"
    }
  ]
}
```

3. Name the policy `OFAuto-TerraformState-Access-Policy`

### Step 2: Create a Custom Policy for ECR Push Access

1. Go to IAM > Policies > Create policy
2. Create a policy with the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "arn:aws:ecr:*:*:repository/ofauto"
    },
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    }
  ]
}
```

3. Name the policy `OFAuto-ECR-Access-Policy`

### Step 3: Create a Custom Policy for ECS Deployment

1. Go to IAM > Policies > Create policy
2. Create a policy with the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:ListTasks"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/Environment": "staging"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
        "arn:aws:iam::*:role/ofauto-staging-ecs-task-execution-role",
        "arn:aws:iam::*:role/ofauto-staging-ecs-task-role"
      ]
    }
  ]
}
```

3. Name the policy `OFAuto-ECS-Deployment-Policy`

### Step 4: Create a Custom Policy for Vault Unseal

1. Go to IAM > Policies > Create policy
2. Create a policy with the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:*:*:key/VAULT_KMS_KEY_ID"
    }
  ]
}
```

3. Replace `VAULT_KMS_KEY_ID` with the actual KMS key ID used for Vault auto-unseal
4. Name the policy `OFAuto-Vault-Unseal-Policy`

### Step 5: Create a Custom Policy for Terraform Infrastructure Management

1. Go to IAM > Policies > Create policy
2. Create a policy with the following JSON for managing all required resources:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "elasticloadbalancing:*",
        "route53:*",
        "logs:*",
        "ecs:*",
        "rds:*",
        "elasticache:*",
        "iam:*",
        "kms:*",
        "secretsmanager:*",
        "application-autoscaling:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/Environment": "staging"
        }
      }
    }
  ]
}
```

3. Name the policy `OFAuto-Terraform-Management-Policy`

### Step 6: Create the CI/CD IAM Role

1. Go to IAM > Roles > Create role
2. Select "GitHub Actions" as the trusted entity
3. Configure the trust relationship with your GitHub repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:yourusername/OFAuto:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

4. Replace `ACCOUNT_ID` with your AWS account ID and adjust the repository name as needed
5. Attach the following policies:
   - `OFAuto-TerraformState-Access-Policy`
   - `OFAuto-ECR-Access-Policy`
   - `OFAuto-ECS-Deployment-Policy`
   - `OFAuto-Vault-Unseal-Policy`
   - `OFAuto-Terraform-Management-Policy`

6. Name the role `OFAuto-CI-CD-Role`
7. Copy the Role ARN for use in GitHub Actions secrets

## GitHub Actions Secrets Configuration

Add the following secrets to your GitHub repository:

1. `AWS_ROLE_TO_ASSUME`: The ARN of the `OFAuto-CI-CD-Role` created above

2. Core application secrets:
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
   - `ENCRYPTION_KEY`
   - `OPENAI_API_KEY`

3. AWS infrastructure secrets:
   - `ACM_CERTIFICATE_ARN`: ARN of your ACM certificate
   - `HOSTED_ZONE_ID`: Route53 hosted zone ID

4. Vault secrets:
   - `VAULT_ADDR`: URL of your Vault instance
   - `VAULT_ROLE_ID`: Vault AppRole role ID
   - `VAULT_SECRET_ID`: Vault AppRole secret ID

5. Monitoring secrets:
   - `SENTRY_DSN`: Sentry project DSN
   - `SLACK_WEBHOOK_URL`: Slack webhook for notifications

These secrets will be used by the GitHub Actions workflow to authenticate with AWS and deploy the infrastructure. 