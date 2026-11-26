# The online backoffice reaches AWS through Vercel's OIDC tokens: no AWS keys
# stored in Vercel. It is its own Vercel project (same repo), so the public site
# and its builds never hold a token this role accepts.
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
          # Production of the backoffice project only; previews and the public
          # site cannot assume it. IAM can only match the project by name.
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
        # Unpublish = delete there.
        Sid      = "PublishedReadDelete"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.assets.arn}/photos/*"
      },
      {
        # Publish = server-side copy of a prepared web version, never an upload:
        # a stolen session cannot host arbitrary HTML/JS on the CDN. The app copies
        # with TaggingDirective=REPLACE, so no tagging permissions are needed.
        Sid       = "PublishByCopyOnly"
        Effect    = "Allow"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.assets.arn}/photos/*"
        Condition = { StringLike = { "s3:x-amz-copy-source" = "${aws_s3_bucket.photos_backup.bucket}/web/*" } }
      },
      {
        # The one file written directly: what the public site renders.
        Sid      = "PublishManifest"
        Effect   = "Allow"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.assets.arn}/photos/manifest.json"
      },
    ]
  })
}
