#/bin/bash

# Deploy to QA

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

#--------------------------------------------------------------------------------------------
# Main branch (QA) Deploy
#--------------------------------------------------------------------------------------------

  echo -en "${GREEN}QA Release...${NC}\n"

  echo -en "${GREEN}make release ...${NC}\n"
  make release

  echo -en "${GREEN}Pushing to builds ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/web-sdk/branch-latest.min.js
  aws s3 cp --content-type="text/javascript" dist/build.js s3://branch-builds/web-sdk/branch.js

  # External services app - ID: 436637608899006753
  ./deployment/build-example-html.sh "key_live_plqOidX7fW71Gzt0LdCThkemDEjCbTgx" "https://api.stage.branch.io" "https://cdn.branch.io/branch-staging-latest.min.js"
  aws s3 cp example.html s3://branch-cdn/example-staging.html

  echo -en "${GREEN}Pushing to CDN ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-staging-latest.min.js --cache-control "max-age=300"

  echo -en "Invalidating cloudfront distribution for staging ...\n"
  aws configure set preview.cloudfront true
  aws cloudfront create-invalidation --distribution-id E10P37NG0GMER --paths /branch-staging-latest.min.js /example-staging

# Exit prompts
echo -en "${GREEN}Done deploy QA script ...${NC}\n"
