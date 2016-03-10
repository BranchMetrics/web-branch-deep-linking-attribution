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

# update to the latest
git pull origin master

read -p "Update CHANGELOG.md?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  vi CHANGELOG.md
  git commit -am "Updated CHANGELOG.md"
fi

echo "Building files"

read -p "Update 0_config.js? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" src/0_config.js
  sed -i -e "s/version = '.*';$/version = '$VERSION_NO_V';/" test/web-config.js
fi

read -p "Update package.json? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION_NO_V\",/" package.json
  sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION_NO_V\"/" package.json
fi

read -p "Bump CHANGELOG version? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  sed -i -e "s/## \[VERSION\] - unreleased/## [$VERSION] - $DATE/" CHANGELOG.md
fi

read -p "Update bower.json? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION_NO_V\",/" bower.json
  sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION_NO_V\"/" bower.json
fi

make release

read -p "Commit? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  git add dist/build.min.js.gz
  git commit -am "Tagging release $VERSION"
  check_git_branch
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
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-latest.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-v2.0.0.min.js --acl public-read
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
  make clean
  make
  git commit -am "Resetting to HEAD"
fi

read -p "Clean up -e backup files?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  rm -f bower.json-e CHANGELOG.md-e package.json-e src/0_config.js-e test/web-config.js-e
fi

echo "Done script."
read -p "Have you updated the javascript version in https://github.com/BranchMetrics/documentation/edit/master/ingredients/web_sdk/_initialization.md ?" -n 1 -r
echo

echo "Post-release sanity checks."
read -p "Can you visit https://cdn.branch.io/branch-$VERSION.min.js ?" -n 1 -r
echo
read -p "Is https://cdn.branch.io/example.html using the right version number $VERSION?" -n 1 -r
echo
read -p "Is https://www.npmjs.com/package/branch-sdk using the right version number $VERSION?" -n 1 -r
echo

echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Ok"
fi

echo "Last step, run:"
echo "    git push; git push origin $VERSION"

echo
echo "Remember to check https://github.com/BranchMetrics/Smart-App-Banner-Deep-Linking-Web-SDK/tree/$VERSION/CHANGELOG.md "
echo
echo "Remember to ping @jed on slack about this release "

echo
