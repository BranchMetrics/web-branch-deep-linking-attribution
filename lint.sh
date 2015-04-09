#!/bin/bash

BAD=0

for file in $( find src | grep 'src/\d' ); do
  cat $file | perl -pe 's#goog.provide\('"'(.*)'"'\);?#/* exported $1 */ var $1;#' | perl -pe 's#goog.require\('"'(.*)'"'\);?#/* global $1: false */#' | npm run jshint -c .jshintrc -;
  if [ "$?" != 0 ]; then
    echo "jshint error in $file"
    BAD=1
  fi;
  npm run jscs -c .jscsrc $file | perl -pe 's/No code style errors found\.\n//'
  if [ "$?" != 0 ]; then
    echo "code style error in $file"
    BAD=1
  fi;
done

if [ "$BAD" != 0 ]; then
  exit 1;
fi;
