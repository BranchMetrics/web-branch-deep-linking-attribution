#!/bin/bash

BAD=0

for file in $( find src | grep 'src/\d' ); do
  cat $file | perl -pe 's#goog.provide\('"'(.*)'"'\);?#/* exported $1 */ var $1;#' | perl -pe 's#goog.require\('"'(.*)'"'\);?#/* global $1:false */#' | jshint -c .jshintrc -

  if [ "$?" != 0 ]; then
    echo "jshint error in $file"
    BAD=1
  fi;
  ERRORS=$(jscs -c .jscsrc $file | grep -e '\d code style errors found' | wc -l | tr -d ' \t')
  if [ "$ERRORS" != 0 ]; then
    jscs -c .jscsrc $file
    BAD=1
  fi;
done

if [ "$BAD" != 0 ]; then
  exit 1;
fi;
