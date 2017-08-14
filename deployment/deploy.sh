#/bin/bash

# Expects a commit pushed with these items:
#
# version: x.y.z
# Changelog: 

set -e

# Updating Changelog from commit message
GIT_COMMIT_MSG=$(git log --format=%B -n 1 $CIRCLE_SHA1)

VERSION=$(echo "$GIT_COMMIT_MSG" | grep version | cut -f 2 -d " ")

DATE=$(date "+%Y-%m-%d")

if [[ "$GIT_COMMIT_MSG" != *"version"* ]]; then
    echo "Version not found in commit message - Not deploying"
    exit 0
fi

echo "Extracted version $VERSION "

CHANGELOG=$(cat $GIT_COMMIT_MSG | awk '/Changelog/{y=1;next}y')

INSERT="\n## [v$VERSION] - $date\n$CHANGELOG"

if [ -z "$CHANGELOG" ]; then
    echo "Changelog not found in commit message - Not deploying"
    exit 0
fi

echo -en "Extracted Changelog:\n$INSERT\n$CHANGELOG\n"

cat <<EOF >add.txt

$INSERT
$CHANGELOG
EOF

# Update CHANGELOG.md
sed -i '.bak' '/\#\# \[VERSION\] - unreleased/r add.txt' CHANGELOG.md

sed -i -e "s/## \[VERSION\] - unreleased/## [$VERSION] - $DATE/" CHANGELOG.md
perl -i -pe '$_ = "\n## [VERSION] - unreleased\n\n" if $. ==4' CHANGELOG.md

echo "Bumping versions ..."
sed -i -e "s/version = '.*';$/version = '$VERSION';/" src/0_config.js
sed -i -e "s/version = '.*';$/version = '$VERSION';/" test/web-config.js

sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION\",/" package.json
sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION\"/" package.json

sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION\",/" bower.json
sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION\"/" bower.json

echo "make release ..."
make release

echo "Commiting changes back to repo"
git commit -am "Tagging release $VERSION [ci skip]"
git tag v$VERSION

if [ "$CIRCLE_BRANCH" == 'production' ]; then
  echo "Pushing to S3: branch-cdn ..."
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-latest.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-v2.0.0.min.js --acl public-read
  aws s3 cp example.html s3://branch-cdn/example.html --acl public-read
  
  # Invalidate cache at CDN
  echo "Invalidating cloudfrond distribution for WebSDK ..."
  aws configure set preview.cloudfront true
  aws cloudfront create-invalidation --distribution-id E10P37NG0GMER --paths /

elif [ "$CIRCLE_BRANCH" == 'master' ]; then
  echo "Pushing to S3: branch-builds ..."
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-$VERSION.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-latest.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-v2.0.0.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" dist/build.js s3://branch-builds/websdk/branch.js --acl public-read
  aws s3 cp example.html s3://branch-builds/websdk/example.html --acl public-read

else
    echo "No associated bucket to $CIRCLE_BRANCH - not Deploying"
    exit 0
fi	

echo "npm publish ..."
#npm publish

# Reset
echo "make clean ..."
make clean
make
git commit -am "Resetting to HEAD"

echo "Pushing changes back to repo ..."
git push origin master
git push origin v$VERSION

# Send an update to slack channels
DEPLOY_IMG=http://workshops.lewagon.org/assets/landing-2/deploy-button-5068ec2c575492ba428569111afe3ce6.jpg
echo "Sending update to slack ..."
#slackcli -t $SLACK_TOKEN -h int-eng -m "$CIRCLE_USERNAME Deployed WedSDK:$CIRCLE_BRANCH v$VERSION" -u websdk-deploy -i $DEPLOY_IMG
#slackcli -t $SLACK_TOKEN -h web-sdk -m "$CIRCLE_USERNAME Deployed WedSDK:$CIRCLE_BRANCH v$VERSION" -u websdk-deploy -i $DEPLOY_IMG

# Exit prompts

echo "Done script ..."
echo "Please update the javascript version in https://github.com/BranchMetrics/documentation/edit/master/ingredients/web_sdk/_initialization.md"

echo "Check the following links are valid:"
echo "- https://cdn.branch.io/branch-$VERSION.min.js"
echo "- https://cdn.branch.io/example.html using the right version number $VERSION"
echo "- https://www.npmjs.com/package/branch-sdk using the right version number $VERSION"

