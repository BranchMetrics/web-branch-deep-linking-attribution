#!/usr/bin/env python

import os
import requests

# for use in circleci
sha = os.environ.get('CIRCLE_SHA1','unknown commit')
env = os.environ.get('CIRCLE_BRANCH','unknown branch')
user = os.environ.get('CIRCLE_USERNAME','unknown user')
repo = os.environ.get('CIRCLE_PROJECT_REPONAME','unknown repo')
giturl = os.environ.get('CIRCLE_COMPARE_URL','unable to get git diff url')
deployurl = os.environ.get('CIRCLE_BUILD_URL','unknown deploy url')
rollbar_k1 = os.environ.get('ROLLBAR_KEY1', 'no key')
rollbar_k2 = os.environ.get('ROLLBAR_KEY2', 'no key')
def rollbar_record_deploy():
        for key in [rollbar_k1, rollbar_k2]:
            resp = requests.post('https://api.rollbar.com/api/1/deploy/', {
                'access_token': key,
                'environment': env,
                'revision': sha,
                'comment': repo + " services deploy completed. " + deployurl + "\ndiff: " + giturl,
                # hack to get the repo name in to deploy message
                'local_username': repo + " " + user
            }, timeout=3)

            if resp.status_code == 200:
                print "Deploy recorded successfully."
            else:
                print "Error recording deploy:", resp.text

rollbar_record_deploy()
