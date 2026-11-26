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

variable "vercel_team_slug" {
  description = "Vercel team that owns the portfolio project (OIDC issuer)"
  type        = string
}

variable "vercel_project" {
  description = "Vercel project name allowed to assume the backoffice role"
  type        = string
}
