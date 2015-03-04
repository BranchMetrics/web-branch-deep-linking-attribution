#!/bin/bash

[ $# -eq 0 ] && { echo "Usage: $0 v1.0.0"; exit 1; }

gulp check

VERSION=$1
DATE=$(date "+%Y-%m-%d")

echo "Releasing Branch Web SDK"

echo "Building files"
make clean
make version=$VERSION all

read -p "Bump changelog version? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	# this is dumb, dunno why  it does this
	sed -e "s/## \[VERSION\] - unreleased/## [$VERSION] - $DATE/" CHANGELOG.md > a
	rm CHANGELOG.md
	mv a CHANGELOG.md
fi

read -p "Commit? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	git commit -am"Tagging release $VERSION"
fi

read -p "Tag? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	git tag $VERSION
fi


read -p "Copy to S3? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	cp dist/build.js dist/branch-$VERSION.js
	cp dist/build.min.js.gz dist/branch-$VERSION.min.js
	aws s3 cp --content-type="text/javascript" dist/branch-$VERSION.js s3://branch-web-sdk/branch-$VERSION.js --acl public-read
	aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/branch-$VERSION.min.js s3://branch-web-sdk/branch-$VERSION.min.js  --acl public-read
	aws s3 cp example.html s3://branch-web-sdk/example.html --acl public-read
fi


read -p "Reset? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	cat CHANGELOG.md | perl -pe '$_ = "\n## [VERSION] - unreleased\n\n" if $. ==4' > a
	mv a CHANGELOG.md
	git commit -am"Resetting to HEAD"
fi

echo "Done script. Now push:"
echo "    git push"
echo "    git push origin $VERSION"

echo ""
