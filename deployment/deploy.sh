#/bin/bash

# Expects a commit pushed with this exact format:
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

# Put this back in once we figure out a push strategy
#CHANGELOG=$(cat $GIT_COMMIT_MSG | awk '/Changelog/{y=1;next}y')
#
#INSERT="\n## [v$VERSION] - $date\n$CHANGELOG"
#
#if [ -z "$CHANGELOG" ]; then
#    echo "Changelog not found in commit message - exiting"
#    exit 1
#fi
#
#cat <<EOF >add.txt
#
#$INSERT
#$CHANGELOG
#EOF

## Update CHANGELOG.md
#sed -i '.bak' '/\#\# \[VERSION\] - unreleased/r add.txt' CHANGELOG.md

#sed -i -e "s/## \[VERSION\] - unreleased/## [$VERSION] - $DATE/" CHANGELOG.md
#perl -i -pe '$_ = "\n## [VERSION] - unreleased\n\n" if $. ==4' CHANGELOG.md

echo "Bumping versions"

# Bump up version
sed -i -e "s/version = '.*';$/version = '$VERSION';/" src/0_config.js
sed -i -e "s/version = '.*';$/version = '$VERSION';/" test/web-config.js

sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION\",/" package.json
sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION\"/" package.json

sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION\",/" bower.json
sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION\"/" bower.json

make release

#chmod 600 ~/deploy/Key.pem
#git config --global user.email "buildbot@branch.io" && git config --global user.name "Build Bot"
#git config --global push.default simple

#echo "Commiting changes back to repo"
#git add dist/build.min.js.gz
#git commit -am "Tagging release $VERSION [ci skip]"
#git add $HOME/$CIRCLE_PROJECT_REPONAME/CHANGELOG.md
#git tag $VERSION

# Push to s3
echo "Pushing to S3"
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js --acl public-read
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-latest.min.js --acl public-read
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-v2.0.0.min.js --acl public-read
aws s3 cp example.html s3://branch-cdn/example.html --acl public-read

# Invalidate cache at CDN
echo "Invalidating cloudfrond distribution for WebSDK"
aws configure set preview.cloudfront true
aws cloudfront create-invalidation --distribution-id E10P37NG0GMER --paths /*.min.js

# Backup S3 bucket
echo "Pushing to backup S3"
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-$VERSION.min.js --acl public-read
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-latest.min.js --acl public-read
aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-v2.0.0.min.js --acl public-read
aws s3 cp example.html s3://branch-builds/websdk/example.html --acl public-read

# Publish to npm
#npm publish

# Reset
make clean
make

# Cleaning up backup files
rm -f bower.json-e CHANGELOG.md-e package.json-e src/0_config.js-e test/web-config.js-e

#git push 
#git push origin $VERSION

# Send an update to slack channels 
echo "Sending update to slack"
#slackcli -t $SLACK_TOKEN -h int-eng -m "$CIRCLE_USERNAME Deploying WedSDK v$VERSION" -u websdk-deploy -i http://workshops.lewagon.org/assets/landing-2/deploy-button-5068ec2c575492ba428569111afe3ce6.jpg
slackcli -t $SLACK_TOKEN -h web-sdk -m "$CIRCLE_USERNAME Deployed WedSDK v$VERSION" -u websdk-deploy -i http://workshops.lewagon.org/assets/landing-2/deploy-button-5068ec2c575492ba428569111afe3ce6.jpg

# Exit prompts

echo "Done script."
echo "Please update the javascript version in https://github.com/BranchMetrics/documentation/edit/master/ingredients/web_sdk/_initialization.md"

echo "Check the following links are valid:"
echo "- https://cdn.branch.io/branch-$VERSION.min.js"
echo "- https://cdn.branch.io/example.html using the right version number $VERSION"
echo "- https://www.npmjs.com/package/branch-sdk using the right version number $VERSION"

