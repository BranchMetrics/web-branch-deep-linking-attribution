#!/bin/bash

[ $# -eq 0 ] && { echo "Usage: $0 v1.0.0"; exit 1; }

gulp check

VERSION=$1
VERSION_NO_V=$(echo $VERSION | tr -d "\nv")
DATE=$(date "+%Y-%m-%d")

echo "Releasing Branch Web SDK"

echo "Building files"
make clean


read -p "Update 0_config.js? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" src/0_config.js
fi

read -p "Update package.json? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION_NO_V\",/" package.json
fi

make release=true all

read -p "Bump changelog version? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	# this is dumb, dunno why  it does this
	sed -i -e "s/## \[VERSION\] - unreleased/## [$VERSION] - $DATE/" CHANGELOG.md
fi

read -p "Update bower.json? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION_NO_V\",/" bower.json
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

read -p "Publish to NPM? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	npm publish
fi

read -p "Reset? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	cat CHANGELOG.md | perl -i -pe '$_ = "\n## [VERSION] - unreleased\n\n" if $. ==4'
	make clean && make
	git commit -am"Resetting to HEAD"
fi

echo "Done script. Now push:"
echo "    git push"
echo "    git push origin $VERSION"

echo ""
