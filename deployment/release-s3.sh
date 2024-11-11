#!/bin/bash

[ $# -eq 0 ] && { echo "Usage: $0 1.0.0"; exit 1; }

VERSION_NO_V=$1
VERSION="v"$VERSION_NO_V
DATE=$(date "+%Y-%m-%d")

echo "Releasing Branch Web SDK"

make release

./deployment/build-example-html.sh "key_live_hcnegAumkH7Kv18M8AOHhfgiohpXq5tB" "https://api2.branch.io" "https://cdn.branch.io/branch-latest.min.js"
aws s3 cp example.html s3://branch-builds/example.html
aws s3 cp example.html s3://branch-cdn/example.html

aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.js s3://branch-cdn/branch-latest.js --cache-control "max-age=300"
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js --cache-control "max-age=300"
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-latest.min.js --cache-control "max-age=300"

echo -en "Invalidating cloudfront distribution...\n"
aws configure set preview.cloudfront true
aws cloudfront create-invalidation --distribution-id E10P37NG0GMER --paths /branch-latest.min.js

echo "Post-release sanity checks."
read -p "Can you visit https://cdn.branch.io/branch-$VERSION.min.js ?" -n 1 -r
echo
read -p "Is https://cdn.branch.io/example.html using the right version number $VERSION?" -n 1 -r
echo
read -p "Is https://www.npmjs.com/package/branch-sdk using the right version number $VERSION?" -n 1 -r
echo