#/bin/bash

# To trigger a production deploy push a 
# commit with these items: 
#
# version: x.y.z
# Changelog: 

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

#--------------------------------------------------------------------------------------------
# Production Deploy
#--------------------------------------------------------------------------------------------

if [ "$CIRCLE_BRANCH" == 'production' ]; then
  
  echo -en "${GREEN}Production Release...${NC}\n"

  GIT_COMMIT_MSG=$(git log --format=%B -n 1 $CIRCLE_SHA1)
  
  VER=$(echo "$GIT_COMMIT_MSG" | grep version | cut -f 2 -d " ")
 
  VERSION=$(echo $VER|tr -d '\r')
 
  DATE=$(date "+%Y-%m-%d")
 
  if [[ "$GIT_COMMIT_MSG" != *"version"* ]]; then
      echo "Version not found in commit message - Not deploying"
      exit 0
  fi
 
  VER_REG='^([0-9]+\.){0,2}(\*|[0-9]+)$'

  if [[ $VERSION =~ $VER_REG ]]; then
     echo -en "${GREEN} Extracted version $VERSION ${NC}\n"
  else
     echo -en "${RED}ERROR: Wrong version input: '$VERSION' - Exiting Build ${NC}\n"
     exit 1
  fi

  # Expect a Changelog in commit message
  CHANGELOG=$(echo "$GIT_COMMIT_MSG" | awk '/Changelog/{y=1;next}y')
  INSERT="## [v$VERSION] - $DATE"

  if [ -z "$CHANGELOG" ]; then
      echo "Changelog not found in commit message - Not deploying"
      exit 0
  fi

  echo -en "\n${GREEN}Extracted Changelog:\n$INSERT\n$CHANGELOG\n${NC}\n"

cat <<EOF >add.txt
$CHANGELOG
EOF

  # Update CHANGELOG.md
  sed -i '/\#\# \[VERSION\] - unreleased/r add.txt' CHANGELOG.md

  sed -i -e "s/## \[VERSION\] - unreleased/## [$VERSION] - $DATE/" CHANGELOG.md
  perl -i -pe '$_ = "\n## [VERSION] - unreleased\n\n" if $. ==4' CHANGELOG.md
 
  echo -en "${GREEN}Bumping versions ...${NC}\n"
  sed -i -e "s/version = '.*';$/version = '$VERSION';/" src/0_config.js
  sed -i -e "s/version = '.*';$/version = '$VERSION';/" test/web-config.js
  
  sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION\",/" package.json
  sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION\"/" package.json
  
  sed -i -e "s/\"version\":.*$/\"version\": \"$VERSION\",/" bower.json
  sed -i -e "s/\"build\":.*$/\"build\": \"$VERSION\"/" bower.json

  echo -en "${GREEN}make release...${NC}\n"
  make release

  rm add.txt

  echo -en "${GREEN}Commiting changes back to repo${NC}\n"
  git config --global user.email "buildbot@branch.io" && git config --global user.name "Build Bot"
  git config --global push.default simple
  git commit -am "Pushing release $VERSION [ci skip]"

  echo -en "${GREEN}Pushing to S3: branch-cdn ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-$VERSION.min.js --acl public-read --cache-control "max-age=300"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-latest.min.js --acl public-read --cache-control "max-age=300"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-cdn/branch-v2.0.0.min.js --acl public-read --cache-control "max-age=300"
  aws s3 cp example.html s3://branch-cdn/example.html --acl public-read

  # Pushing to QA builds
  echo -en "${GREEN}Pushing to S3: branch-builds ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-$VERSION.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-latest.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-v2.0.0.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" dist/build.js s3://branch-builds/websdk/branch.js --acl public-read
  aws s3 cp example.html s3://branch-builds/websdk/example.html --acl public-read
  
  # Invalidate cache at CDN
  echo -en "${GREEN}Invalidating cloudfrond distribution for WebSDK ...${NC}\n"
  aws configure set preview.cloudfront true
  aws cloudfront create-invalidation --distribution-id E10P37NG0GMER --paths /branch-latest.min.js /example.html /branch-v2.0.0.min.js

  echo -en "${GREEN}Pushing git tags${NC}\n"
  git tag v$VERSION
  git push origin v$VERSION

  echo -en "${GREEN}npm publish ...${NC}\n"
  npm publish

  # Reset
  echo -en "${GREEN}make clean ...${NC}\n"
  make clean
  make
  git commit -am "Resetting to HEAD [ci skip]"

  echo -en "${GREEN}Updating production files ...${NC}\n"
  git push origin $CIRCLE_BRANCH

  # Push back to master
  echo -en "${GREEN}Updating Master files ...${NC}\n"
  rm -rf /tmp/$CIRCLE_PROJECT_REPONAME
  git clone git@github.com:BranchMetrics/$CIRCLE_PROJECT_REPONAME.git /tmp/$CIRCLE_PROJECT_REPONAME

  pushd /tmp/$CIRCLE_PROJECT_REPONAME 

  git merge origin/production -m "Merge Production [ci skip]"
  git push origin master
  popd

  # Send an update to slack channels

  DEPLOY_IMG=http://workshops.lewagon.org/assets/landing-2/deploy-button-5068ec2c575492ba428569111afe3ce6.jpg
  echo -en "${GREEN}Sending update to slack ...${NC}\n"
  #uncomment to send updates to int-eng
  #slackcli -t $SLACK_TOKEN -h int-eng -m $MESSAGE -u websdk-deploy -i $DEPLOY_IMG
  slackcli -t $SLACK_TOKEN -h web-sdk -m "$CIRCLE_USERNAME deployed WebSDK v$VERSION" -u websdk-deploy -i $DEPLOY_IMG
  
  echo "Please update the javascript version in https://github.com/BranchMetrics/documentation/edit/master/ingredients/web_sdk/_initialization.md"

  echo "Check the following links are valid:"
  echo "- https://cdn.branch.io/branch-$VERSION.min.js"
  echo "- https://cdn.branch.io/example.html using the right version number $VERSION"
  echo "- https://www.npmjs.com/package/branch-sdk using the right version number $VERSION"

#--------------------------------------------------------------------------------------------
# Master Deploy
#--------------------------------------------------------------------------------------------

elif [ "$CIRCLE_BRANCH" == 'master' ]; then

  echo -en "${GREEN}QA Release...${NC}\n"

  echo -en "${GREEN}make release ...${NC}\n"
  make release

  echo -en "${GREEN}Pushing to S3: branch-builds ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-$VERSION.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-latest.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-v2.0.0.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" dist/build.js s3://branch-builds/websdk/branch.js --acl public-read
  aws s3 cp example.html s3://branch-builds/websdk/example.html --acl public-read

else
    echo -en "${GREEN}No associated target to $CIRCLE_BRANCH - not Deploying${NC}\n"
    exit 0
fi

# Rollbar updates
if [ "$CIRCLE_BRANCH" == 'production' ] || [ "$CIRCLE_BRANCH" == 'master' ] ; then
    pip install requests
    deployment/rollbar.py
fi

# Exit prompts
echo -en "${GREEN}Done deploy script ...${NC}\n"

