#!/bin/bash

[ $# -eq 0 ] && { echo "Usage: $0 v1.0.0"; exit 1; }

VERSION_NO_V=$(echo $1 | tr -d "\nv")
VERSION="v"$VERSION_NO_V
DATE=$(date "+%Y-%m-%d")

echo "Releasing Branch Web SDK"

# check whether on master branch
branch_name="$(git symbolic-ref HEAD 2>/dev/null)"
branch_name=${branch_name##refs/heads/}
if [ $branch_name != "master" ]; then
  echo "ERROR: not on master branch: "$branch_name
  exit 1
fi

# check whether the branch is clean
check_git_branch() {
  if [[ $(git status --porcelain 2> /dev/null | tail -n1) != "" ]]
  then
    echo 'ERROR: branch dirty'
    exit 1
  fi
}

check_git_branch

sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" src/0_config.js
sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" test/web-config.js

make release

./deployment/build-example-html.sh "key_live_hcnegAumkH7Kv18M8AOHhfgiohpXq5tB" "https://api2.branch.io" "https://cdn.branch.io/branch-latest.min.js"
aws s3 cp example.html s3://branch-builds/example.html

aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js --acl public-read
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-latest.min.js --acl public-read

echo -en "Invalidating cloudfront distribution...\n"
aws configure set preview.cloudfront true
aws cloudfront create-invalidation --distribution-id E10P37NG0GMER --paths /branch-latest.min.js

npm publish

echo "Post-release sanity checks."
read -p "Can you visit https://cdn.branch.io/branch-$VERSION.min.js ?" -n 1 -r
echo
read -p "Is https://cdn.branch.io/example.html using the right version number $VERSION?" -n 1 -r
echo
read -p "Is https://www.npmjs.com/package/branch-sdk using the right version number $VERSION?" -n 1 -r
echo