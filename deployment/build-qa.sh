  echo -en "${GREEN}QA Release...${NC}\n"

  echo -en "${GREEN}make release ...${NC}\n"
  make release

  echo -en "${GREEN}Pushing to S3: branch-builds ...${NC}\n"
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-2.71.0.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-latest.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" --content-encoding="gzip" dist/build.min.js.gz s3://branch-builds/websdk/branch-v2.0.0.min.js --acl public-read
  aws s3 cp --content-type="text/javascript" dist/build.js s3://branch-builds/websdk/branch.js --acl public-read
  aws s3 cp example.html s3://branch-builds/websdk/example.html --acl public-read
  