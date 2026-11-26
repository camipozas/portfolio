# GitHub Actions authenticate with OIDC: no AWS keys stored in the repo.
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

locals {
  state_bucket_arn = "arn:aws:s3:::camipg-tfstate-326733328768"
}

data "aws_iam_policy_document" "gha_trust" {
  for_each = {
    # Any PR branch of this repo. Fork PRs never get an OIDC token.
    plan = "repo:${var.github_repository}:pull_request"
    # Only jobs bound to the `production` environment, which only main can use.
    apply = "repo:${var.github_repository}:environment:production"
  }

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [each.value]
    }
  }
}

resource "aws_iam_role" "gha_plan" {
  name               = "gha-portfolio-terraform-plan"
  assume_role_policy = data.aws_iam_policy_document.gha_trust["plan"].json
}

resource "aws_iam_role_policy_attachment" "gha_plan_read_only" {
  role       = aws_iam_role.gha_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "gha_plan" {
  name = "state-lock-and-no-photos"
  role = aws_iam_role.gha_plan.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # use_lockfile writes and removes <key>.tflock next to the state.
        Sid      = "StateLock"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:DeleteObject"]
        Resource = "${local.state_bucket_arn}/*.tflock"
      },
      {
        # ReadOnlyAccess would let any PR branch download the photos.
        Sid      = "NoPhotoContent"
        Effect   = "Deny"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.photos_backup.arn}/*"
      },
    ]
  })
}

resource "aws_iam_role" "gha_apply" {
  name               = "gha-portfolio-terraform-apply"
  assume_role_policy = data.aws_iam_policy_document.gha_trust["apply"].json
}

# shortcut: admin because this stack manages IAM itself; narrow it if the
# account ever hosts more than this portfolio.
resource "aws_iam_role_policy_attachment" "gha_apply_admin" {
  role       = aws_iam_role.gha_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
