#!/bin/bash

VERSION_NO_V=$(git rev-parse --short HEAD)
VERSION="v"$VERSION_NO_V
DATE=$(date "+%Y-%m-%d")

echo "Deploying BETA version of Branch Web SDK: branch-beta-$VERSION"

make release

sed -i -e "s/branch-latest\.min\.js/branch-beta-$VERSION\.js/" example.html
sed -i -e "s/dist\/build\.min\.js/https\:\/\/cdn\.branch\.io\/branch-beta-$VERSION\.js/" event-example.html

read -p "Copy to S3? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  aws s3 cp --acl public-read --content-type="text/javascript" dist/build.min.js s3://branch-cdn/branch-beta-$VERSION.js
  aws s3 cp --acl public-read example.html s3://branch-cdn/example-beta-$VERSION.html
  aws s3 cp --acl public-read event-example.html s3://branch-cdn/event-example-beta-$VERSION.html
fi

sed -i -e "s/branch-beta-$VERSION\.js/branch-latest\.min\.js/" example.html
sed -i -e "s/https\:\/\/cdn\.branch\.io\/branch-beta-$VERSION\.js/dist\/build\.min\.js/" event-example.html

rm -f dist/build.min.js.gz

echo
echo
echo
echo

echo "Beta builds have been deployed:"
echo "https://cdn.branch.io/branch-beta-$VERSION.js"
echo "http://cdn.branch.io/example-beta-$VERSION.html"
echo "http://cdn.branch.io/event-example-beta-$VERSION.html"

echo
