output "assets_cdn_domain" {
  value = aws_cloudfront_distribution.assets.domain_name
}

output "photos_backup_bucket" {
  value = aws_s3_bucket.photos_backup.bucket
}

output "photos_sync_role_arn" {
  value = aws_iam_role.photos_sync.arn
}

output "gha_plan_role_arn" {
  value = aws_iam_role.gha_plan.arn
}

output "gha_apply_role_arn" {
  value = aws_iam_role.gha_apply.arn
}

output "backoffice_role_arn" {
  value = aws_iam_role.backoffice.arn
}
