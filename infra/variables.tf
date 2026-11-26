variable "env" {
  type = string
}

variable "region" {
  type = string
}

variable "github_repository" {
  description = "owner/repo allowed to assume the CI roles through OIDC"
  type        = string
}
