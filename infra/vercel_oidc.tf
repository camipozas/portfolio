# The online backoffice (Vercel, production only) reaches AWS through Vercel's
# OIDC tokens: no AWS keys stored in Vercel.
resource "aws_iam_openid_connect_provider" "vercel" {
  url            = "https://oidc.vercel.com/${var.vercel_team_slug}"
  client_id_list = ["https://vercel.com/${var.vercel_team_slug}"]
}

resource "aws_iam_role" "backoffice" {
  name = "portfolio-backoffice"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.vercel.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "oidc.vercel.com/${var.vercel_team_slug}:aud" = "https://vercel.com/${var.vercel_team_slug}"
          # Production deployments of this project only; previews cannot publish.
          "oidc.vercel.com/${var.vercel_team_slug}:sub" = "owner:${var.vercel_team_slug}:project:${var.vercel_project}:environment:production"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "backoffice" {
  name = "curate-and-publish-photos"
  role = aws_iam_role.backoffice.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "BackupList"
        Effect    = "Allow"
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.photos_backup.arn
        Condition = { StringLike = { "s3:prefix" = ["web/*", "curation/*"] } }
      },
      {
        # Web versions only (watermarked / thumbnails / EXIF json); the
        # full-size originals under edited/ stay out of reach of the website.
        Sid      = "BackupReadWebVersions"
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.photos_backup.arn}/web/*"
      },
      {
        # The backoffice state (what is visible, order, titles).
        Sid      = "CurationState"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.photos_backup.arn}/curation/*"
      },
      {
        Sid       = "PublishedList"
        Effect    = "Allow"
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.assets.arn
        Condition = { StringLike = { "s3:prefix" = ["photos/*"] } }
      },
      {
        # Publish = server-side copy from web/ into photos/; unpublish = delete there.
        Sid      = "Publish"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.assets.arn}/photos/*"
      },
    ]
  })
}
