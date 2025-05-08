terraform {
  backend "s3" {
    bucket         = "ofauto-terraform-state"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "ofauto-terraform-locks"
  }
} 