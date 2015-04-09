#!/bin/bash

BAD=0

exec 5>&1

for file in $( find src test | grep '\d_' ); do
  jshintrc=".jshintrc"
  if [[ $file == test* ]]; then
    jshintrc=".jshintrc-test"
  fi

  ERRORS=$( cat $file | perl -pe 's#goog.provide\('"'(.*)'"'\);?#/* exported $1 */ var $1;#' | perl -pe 's#goog.require\('"'(.*)'"'\);?#/* global $1:false */#' | jshint -c $jshintrc - | perl -pe "s#stdin#$file#" | tee >(cat - >&5) )
  if [ "$ERRORS" != "" ]; then
    BAD=1
  fi;

  ERRORS=$( jscs -c .jscsrc $file | grep -v 'No code style errors' | tee >(cat - >&5) )
  if [ "$ERRORS" != "" ]; then
    BAD=1
  fi;
done

if [ "$BAD" != 0 ]; then
  exit 1;
fi;
