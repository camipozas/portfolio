# GitHub Actions authenticate with OIDC: no AWS keys stored in the repo.
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "gha_trust" {
  for_each = {
    # Any PR branch of this repo. Fork PRs never get an OIDC token.
    plan = "repo:${var.github_repository}:pull_request"
    # Only jobs bound to the `aws-infra` environment, which only main can use.
    # Not `production`: Vercel already owns a `Production` environment with no
    # branch policy, and GitHub matches environment names case-insensitively.
    apply = "repo:${var.github_repository}:environment:aws-infra"
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

# PR plans run with -lock=false, so this role writes nothing, not even the
# state lock (it could otherwise delete a lock held by an apply).
resource "aws_iam_role_policy" "gha_plan" {
  name = "no-photo-content"
  role = aws_iam_role.gha_plan.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      # ReadOnlyAccess would let any PR branch download the photos; the
      # wildcard also covers GetObjectVersion (?versionId=) and attributes.
      Sid      = "NoPhotoContent"
      Effect   = "Deny"
      Action   = "s3:GetObject*"
      Resource = "${aws_s3_bucket.photos_backup.arn}/*"
    }]
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
