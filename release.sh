#!/bin/bash

[ $# -eq 0 ] && { echo "Usage: $0 v1.0.0"; exit 1; }

VERSION=$1
VERSION_NO_V=$(echo $VERSION | tr -d "\nv")
DATE=$(date "+%Y-%m-%d")

echo "Releasing Branch Web SDK"

echo "Building files"

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

read -p "Update plugin.xml? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	sed -i -e "s/version=\".*\"/version=\"$VERSION_NO_V\"/" plugin.xml
fi

make release

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
	make dist/web/build.min.js.gz
	aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/web/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js  --acl public-read
	aws s3 cp testbeds/web/example.html s3://branch-cdn/example.html --acl public-read
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
	perl -i -pe '$_ = "\n## [VERSION] - unreleased\n\n" if $. ==4' CHANGELOG.md
	make clean && make
	git commit -am"Resetting to HEAD"
fi

echo "Integration Guide URL: https://github.com/BranchMetrics/Branch-Integration-Guides/blob/master/smart-banner-guide.md"
read -p "Did you update the Branch Integration Guide, specifically the Javascript Snippet and App Banner?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	echo "Ok"
fi

echo "Done script. Now push:"
echo "    git push"
echo "    git push origin $VERSION"

echo ""
