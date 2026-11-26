terraform {
  # Exact pin, matching the CI pin (.github/actions/setup-and-validate-terraform)
  # and .terraform-version. A newer local binary re-stamps the state and the CI
  # can no longer read it; this makes that fail at init instead.
  required_version = "1.17.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Partial config: bucket, key and region come from -backend-config (see README
  # and the TF_STATE_* repo variables). The state bucket is created by hand once,
  # it cannot manage itself.
  backend "s3" {
    use_lockfile = true
    encrypt      = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.env
      Project     = "portfolio"
      ManagedBy   = "terraform"
    }
  }
}
