#!/bin/bash

# Hardcoded file paths
templateFile="examples/example.template.html"
outputFile="example.html"
tempFile="temp.html"  # Temporary file for edits

# Check if the required arguments are provided
if [[ $# -ne 3 ]]; then
    echo "Usage: $0 <key_replacement> <api_replacement> <script_replacement>"
    exit 1
fi

# Assign command-line arguments to replacement variables
key_replacement="$1"
api_replacement="$2"
script_replacement="$3"

# Define placeholders
key_placeholder="key_place_holder"
api_placeholder="api_place_holder"
script_placeholder="script_place_holder"

# Check if the template file exists
if [[ ! -f "$templateFile" ]]; then
    echo "Template file $templateFile does not exist."
    exit 1
fi

# Copy the template file to a temporary file
cp "$templateFile" "$tempFile"
echo "Copied $templateFile to $tempFile"

# Perform the replacements using sed and output to the temp file
sed -e "s|$key_placeholder|$key_replacement|g" \
    -e "s|$api_placeholder|$api_replacement|g" \
    -e "s|$script_placeholder|$script_replacement|g" \
    "$tempFile" > "$outputFile"

# Clean up the temporary file
rm "$tempFile"

echo "Placeholders replaced successfully in $outputFile"
