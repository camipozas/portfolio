# Lightroom backup: originals (Deep Archive), edited full size (Glacier IR) and
# web sizes. Private, no CDN. Photos get deleted from Lightroom after landing
# here, so this bucket is the only copy besides Drive: nothing may delete objects.
resource "aws_s3_bucket" "photos_backup" {
  bucket = "camipg-photos-backup-326733328768"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "photos_backup" {
  bucket = aws_s3_bucket.photos_backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# An overwrite keeps the previous version instead of losing it.
resource "aws_s3_bucket_versioning" "photos_backup" {
  bucket = aws_s3_bucket.photos_backup.id

  versioning_configuration {
    status = "Enabled"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "photos_backup" {
  bucket = aws_s3_bucket.photos_backup.id

  # Every backoffice save is a new version of curation/ and deletes are denied;
  # keep 90 days of history, not forever.
  rule {
    id     = "expire-old-curation-versions"
    status = "Enabled"
    filter {
      prefix = "curation/"
    }
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  # Multi-GB uploads that die halfway are billed until aborted.
  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_policy" "photos_backup" {
  bucket = aws_s3_bucket.photos_backup.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Applies to every principal in the account, CI and root sessions
        # included. Removing a photo on purpose = change this policy in a PR.
        Sid       = "DenyObjectDeletes"
        Effect    = "Deny"
        Principal = "*"
        Action    = ["s3:DeleteObject", "s3:DeleteObjectVersion"]
        Resource  = "${aws_s3_bucket.photos_backup.arn}/*"
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [aws_s3_bucket.photos_backup.arn, "${aws_s3_bucket.photos_backup.arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
    ]
  })

  # Guards against replacement only: removing the whole resource block still
  # deletes the policy. scripts/verify.sh fails the apply if that happens.
  lifecycle {
    prevent_destroy = true
  }
}

# Role used on the Mac by the backup script and the local backoffice.
resource "aws_iam_role" "photos_sync" {
  name                 = "photos-sync"
  max_session_duration = 43200 # 12 h; the CLI renews it from the user below

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = aws_iam_user.photos_mac.arn }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "photos_sync" {
  name = "photos-sync"
  role = aws_iam_role.photos_sync.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "BackupList"
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.photos_backup.arn
      },
      {
        # No delete: write-once from the script's point of view.
        Sid      = "BackupReadWrite"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:RestoreObject"]
        Resource = "${aws_s3_bucket.photos_backup.arn}/*"
      },
      {
        Sid       = "PublishedList"
        Effect    = "Allow"
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.assets.arn
        Condition = { StringLike = { "s3:prefix" = ["photos/*"] } }
      },
      {
        # The backoffice unpublishes by deleting here; the backup copy stays.
        Sid      = "PublishedReadWriteDelete"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.assets.arn}/photos/*"
      },
    ]
  })
}

# Long-lived identity of the Mac. Its only permission is assuming photos-sync.
# The access key is created with the CLI straight into the macOS Keychain
# (README), never in Terraform: aws_iam_access_key would put the secret in state.
resource "aws_iam_user" "photos_mac" {
  name = "photos-mac"
}

resource "aws_iam_user_policy" "photos_mac" {
  name = "assume-photos-sync"
  user = aws_iam_user.photos_mac.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "sts:AssumeRole"
      Resource = aws_iam_role.photos_sync.arn
    }]
  })
}
