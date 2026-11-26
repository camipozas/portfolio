# Public assets of camipg.com (CV, favicons, published photos), served only
# through CloudFront. The bucket itself stays private (OAC).
resource "aws_s3_bucket" "assets" {
  bucket = "assets-portfolio"
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
  }
}

# CloudFront reads the WHOLE bucket, so nothing private may ever live here:
# photo originals go to the backup bucket (photos.tf), which has no CDN.
resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  policy = jsonencode({
    Version = "2008-10-17"
    Id      = "PolicyForCloudFrontPrivateContent"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipal"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.assets.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.assets.arn }
      }
    }]
  })
}

resource "aws_cloudfront_origin_access_control" "assets" {
  name                              = aws_s3_bucket.assets.bucket_regional_domain_name
  description                       = "" # provider default is "Managed by Terraform"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

locals {
  assets_origin_id = aws_s3_bucket.assets.bucket_regional_domain_name

  # AWS managed policies (Managed-CachingOptimized, Managed-CORS-CustomOrigin,
  # Managed-SimpleCORS). CachingOptimized honours the object's Cache-Control,
  # so manifest.json is uploaded with a short max-age instead of invalidating.
  cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  origin_request_policy_id   = "59781a5b-3903-41f3-afcb-af62929ccde1"
  response_headers_policy_id = "60669652-455b-4ae9-85a4-c4c02393f86c"
}

resource "aws_cloudfront_distribution" "assets" {
  enabled         = true
  is_ipv6_enabled = true
  http_version    = "http2"
  price_class     = "PriceClass_All"

  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = local.assets_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.assets.id
  }

  default_cache_behavior {
    target_origin_id = local.assets_origin_id
    # shortcut: imported as it was (http allowed); switch to redirect-to-https in its own PR.
    viewer_protocol_policy     = "allow-all"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = local.cache_policy_id
    origin_request_policy_id   = local.origin_request_policy_id
    response_headers_policy_id = local.response_headers_policy_id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # A replacement gets a new *.cloudfront.net domain and breaks every asset URL.
  lifecycle {
    prevent_destroy = true
  }
}
