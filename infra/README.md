# infra

AWS for camipg.com: the assets CDN and the Lightroom photo backup.
Account `326733328768`, region `us-east-1`.

| File | What |
|---|---|
| `cdn.tf` | `assets-portfolio` bucket + CloudFront (OAC). Everything in this bucket is public through the CDN. |
| `photos.tf` | Private photo backup bucket (no CDN, deletes denied) + `photos-sync` role and `photos-mac` user for the Mac. |
| `github_oidc.tf` | GitHub OIDC + `gha-portfolio-terraform-plan` (PRs, read-only) and `gha-portfolio-terraform-apply` (environment `production`). |
| `imports.tf` | Resources that existed before this folder, adopted with `import` blocks. |
| `scripts/verify.sh` | Post-apply live checks (run by CI after every apply). |

## How changes ship

1. Open a PR → **Terraform Plan** comments the plan on the PR; `Plan Result` is the required check.
2. Merge to `main` → **Terraform Apply** applies, then verifies:
   - `terraform plan -detailed-exitcode` must be clean (nothing pending or drifted);
   - `scripts/verify.sh` checks the live resources (public access blocked, versioning, delete-deny, CDN answering).

Do not apply from a laptop except for the bootstrap below.

## Bootstrap (done once, 2026-11-26)

The state bucket `camipg-tfstate-326733328768` was created by hand (private,
versioned): the stack cannot hold its own backend. The first apply ran locally,
because the CI roles it creates did not exist yet.

```bash
cd infra
terraform init -backend-config="bucket=camipg-tfstate-326733328768" \
  -backend-config="key=portfolio/infra.tfstate" -backend-config="region=us-east-1"
terraform plan -var-file=prod.tfvars
```

GitHub settings the workflows need:

- Environment `production`, deployment branches limited to `main`.
- Secret `AWS_ACCOUNT_ID`; variables `AWS_REGION`, `TF_STATE_BUCKET`, `TF_STATE_KEY`.

## Mac credentials (photo scripts and local backoffice)

`photos-mac` can only assume `photos-sync`. Its access key lives in the macOS
Keychain, never in a file, in Terraform state or in a terminal transcript:

```bash
aws iam create-access-key --user-name photos-mac \
  --query '{Version:`1`,AccessKeyId:AccessKey.AccessKeyId,SecretAccessKey:AccessKey.SecretAccessKey}' \
  --output json \
  | security add-generic-password -a photos-mac -s aws-photos-mac -U -w "$(cat)"
```

`~/.aws/config`:

```ini
[profile photos-mac]
credential_process = /usr/bin/security find-generic-password -a photos-mac -s aws-photos-mac -w

[profile photos]
role_arn = arn:aws:iam::326733328768:role/photos-sync
source_profile = photos-mac
duration_seconds = 43200
region = us-east-1
```

The CLI renews the role session by itself, so `AWS_PROFILE=photos` keeps working
until the key is rotated (create the new key, update the Keychain item, delete the old key).
