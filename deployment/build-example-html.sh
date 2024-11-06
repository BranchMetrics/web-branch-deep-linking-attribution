#!/bin/bash

# This script takes the example.template.html and outputs the example.html
# based on the api key, the desired api, and the desired sdk build file

# Used to publish to s3 for example files

templateFile="examples/example.template.html"
outputFile="example.html"
tempFile="temp.html"  # Temporary file for edits

if [[ $# -ne 3 ]]; then
    echo "Usage: $0 <key_replacement> <api_replacement> <script_replacement>"
    exit 1
fi

key_replacement="$1"
api_replacement="$2"
script_replacement="$3"

key_placeholder="key_place_holder"
api_placeholder="api_place_holder"
script_placeholder="script_place_holder"

if [[ ! -f "$templateFile" ]]; then
    echo "Template file $templateFile does not exist."
    exit 1
fi

cp "$templateFile" "$tempFile"
echo "Copied $templateFile to $tempFile"

sed -e "s|$key_placeholder|$key_replacement|g" \
    -e "s|$api_placeholder|$api_replacement|g" \
    -e "s|$script_placeholder|$script_replacement|g" \
    "$tempFile" > "$outputFile"

rm "$tempFile"
echo "Placeholders replaced successfully in $outputFile"
