# Created by hand before this folder existed; adopted without recreating them.
# Safe to keep: an import block for a resource already in state is a no-op.
import {
  to = aws_s3_bucket.assets
  id = "assets-portfolio"
}

import {
  to = aws_s3_bucket_policy.assets
  id = "assets-portfolio"
}

import {
  to = aws_s3_bucket_public_access_block.assets
  id = "assets-portfolio"
}

import {
  to = aws_s3_bucket_cors_configuration.assets
  id = "assets-portfolio"
}

import {
  to = aws_cloudfront_origin_access_control.assets
  id = "E3SBJCC03TCJG"
}

import {
  to = aws_cloudfront_distribution.assets
  id = "E1AQ2C1D8LB7EV"
}

import {
  to = aws_s3_bucket.photos_backup
  id = "camipg-photos-backup-326733328768"
}

import {
  to = aws_s3_bucket_public_access_block.photos_backup
  id = "camipg-photos-backup-326733328768"
}

import {
  to = aws_s3_bucket_versioning.photos_backup
  id = "camipg-photos-backup-326733328768"
}
