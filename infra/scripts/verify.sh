#!/usr/bin/env bash
# Post-apply checks of the live infra. Runs in CI after apply (and locally with
# AWS_PROFILE=personal). Every check writes a line to the job summary.
set -uo pipefail

summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
failed=0
check() { # check <description> <command...>
  local desc=$1; shift
  if "$@" > /dev/null 2>&1; then
    echo "✅ $desc" >> "$summary"
  else
    echo "❌ $desc" | tee -a "$summary"
    failed=1
  fi
}

cdn=$(terraform output -raw assets_cdn_domain)
backup=$(terraform output -raw photos_backup_bucket)

all_blocked() {
  [[ $(aws s3api get-public-access-block --bucket "$1" \
    --query 'PublicAccessBlockConfiguration.[BlockPublicAcls,IgnorePublicAcls,BlockPublicPolicy,RestrictPublicBuckets]' \
    --output text) == $'True\tTrue\tTrue\tTrue' ]]
}
versioning_on() {
  [[ $(aws s3api get-bucket-versioning --bucket "$1" --query Status --output text) == "Enabled" ]]
}
denies_deletes() {
  aws s3api get-bucket-policy --bucket "$1" --query Policy --output text | grep -q DenyObjectDeletes
}
cdn_serves() {
  [[ $(curl -s -o /dev/null -w '%{http_code}' "https://$cdn/$1") == "200" ]]
}

check "Backup bucket blocks all public access" all_blocked "$backup"
check "Backup bucket keeps versions" versioning_on "$backup"
check "Backup bucket denies object deletes" denies_deletes "$backup"
check "Assets bucket blocks all public access" all_blocked assets-portfolio
check "CloudFront serves the site assets" cdn_serves public/favicon.ico

exit $failed
