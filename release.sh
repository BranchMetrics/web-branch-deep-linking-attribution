#!/bin/bash

[ $# -eq 0 ] && { echo "Usage: $0 v1.0.0"; exit 1; }

VERSION_NO_V=$(echo $1 | tr -d "\nv")
VERSION="v"$VERSION_NO_V
DATE=$(date "+%Y-%m-%d")

echo "Sanity checks"

read -p "Are you on the master branch?" -n 1 -r
read -p "Have you amended CHANGELOG.md and git push it?" -n 1 -r
read -p "Are you synced to HEAD?" -n 1 -r

echo "Releasing Branch Web SDK"

echo "Building files"

read -p "Update 0_config.js? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" src/0_config.js
	sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" test/web-config.js
	# sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" test/cordova-config.js
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

read -p "Bump build number? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION_NO_V\"/" bower.json
	sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION_NO_V\"/" package.json
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
	aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js  --acl public-read
	aws s3 cp example.html s3://branch-cdn/example.html --acl public-read
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

read -p "Clean up -e backup files?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  rm -f bower.json-e CHANGELOG.md-e package.json-e plugin.xml-e src/0_config.js-e test/web-config.js-e
fi

echo "Done script."
read -p "Have you updated the javascript version in https://github.com/BranchMetrics/documentation/edit/master/ingredients/web_sdk/_initialization.md ?" -n 1 -r
read -p "Have you updated the javascript version in https://github.com/BranchMetrics/documentation/edit/master/ingredients/web_sdk/send_sms_example.md ?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	echo "Ok"
fi

echo "Last step, run:"
echo "    git push; git push origin $VERSION"

echo ""
