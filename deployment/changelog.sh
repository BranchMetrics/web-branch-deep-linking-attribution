#/bin/bash

#
# Script to read all commits since last release

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

#--------------------------------------------------------------------------------------------
# Read
#--------------------------------------------------------------------------------------------

# Checking if the first command-line argument has a value
if [ -z "$1" ]; then
  echo "No value provided for the argument - Last release tag.so exiting..."
  exit 1
fi

changelog_file="CHANGELOG.md"

# Check if the changelog file exists
if [ ! -f "$changelog_file" ]; then
    echo "Changelog file '$changelog_file' does not exist."
    exit 1
fi

# Accessing the first command-line argument for Last release tag
LAST_RELEASE_TAG=$1


# Function to get and print all release tags
printReleaseTags() {
    git pull origin
    git fetch --tags origin
    tags=$(git tag --list)

    echo "Release Tags:"
    echo "${tags}"
}

# Check if LAST_RELEASE_TAG is part of tags
checkReleaseTagParam() {
  # Enable case-insensitive matching
  shopt -s nocasematch

  if [[ "$tags" != *"$LAST_RELEASE_TAG"* ]]; then
    echo "The search string '$LAST_RELEASE_TAG' is not a valid tag."
    exit 1  # Exit with a non-zero status code
  fi

  # Disable case-insensitive matching
  shopt -u nocasematch
}
# Function to get all commit hashes based on release tag
getCommitsByReleaseTag() {
    # Fetch the latest changes from the remote repository
    
    git fetch --tags

    # Get the commit hashes since the last release tag
    COMMITS=$(git log ${LAST_RELEASE_TAG}..HEAD --pretty=format:"%H")
}

# Function to check if a string follows conventional commit format
check_conventional_commit() {
  commit_message_input="$1"
  echo "Checking Each line: ${commit_message_input}"
  # Pattern for conventional commit format
  conventional_commit_pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?!?:\s*.+"
  commit_message_input=$(echo $commit_message_input | awk '{ print tolower($0) }')
  if [[ $commit_message_input =~ $conventional_commit_pattern ]]; then
    return 0  # Return true
  else
    return 1  # Return false
  fi
}

# Function to check if a string follows conventional commit format
check_conventional_commit_changelog_included() {
  commit_message="$1"
  echo "Checking Each line: ${commit_message}"
  # Pattern for conventional commit format
  conventional_commit_changelog_pattern="^(feat|fix)(\(.+\))?!?:\s*.+"
  commit_message=$(echo $commit_message | awk '{ print tolower($0) }')
  if [[ $commit_message =~ $conventional_commit_changelog_pattern ]]; then
    return 0  # Return true
  else
    return 1  # Return false
  fi
}

# Function to check if a string starts with a hyphen
check_starts_with_hyphen() {
  string="$1"

  if [[ $string == -* ]]; then
    return 0  # Return true if it starts with a hyphen
  else
    return 1  # Return false if it does not start with a hyphen
  fi
}

# Function to remove white spaces around colons
remove_spaces_around_colon() {
    local input="$1"
    local output="${input// :/:}"
    output="${output//: /:}"
    echo "$output"
}

printReleaseTags

checkReleaseTagParam


getCommitsByReleaseTag

# Initialize the global string
global_string=""

# Iterate over each commit hash
for commit in $COMMITS; do
    echo "-------------------------"
    echo "Commit: $commit"

    echo -en "${GREEN}Commit details.${NC}\n"
    # Get commit details
    git show --quiet --format="%B" $commit

    echo -en "${GREEN}Print full commit msg ...${NC}\n"

    GIT_COMMIT_MSG=$(git log --format=%B -n 1 $commit)

     # Expect a Changelog in commit message
    CHANGELOG=$(echo "$GIT_COMMIT_MSG")
    
    echo -en "${CHANGELOG}\n"
    
    echo -en "${GREEN}Extracting each message.. ${NC}\n"

    # Read and print each line
    echo "Printing each line:"

    while IFS= read -r line; do
    if [[ $line =~ ^- ]]; then
        EachLine=${line#*- }
        echo "Each line: ${EachLine}"
        EachLine="${EachLine#-}"
        # Remove extra spaces around colon
        EachLine=$(remove_spaces_around_colon "$EachLine")
        if check_conventional_commit "$EachLine"; then
            echo "The commit follows conventional commit format."
            # Extracting the "type"
            part1="${EachLine#*- }"
            part1="${part1%%(*}"
            part1="${part1#-}"
            echo "Part 1: ${part1}"

            # Extracting the "scope"
            part2="${EachLine#*\(}"
            part2="${part2%%)*}"
            echo "Part 2: ${part2}"

            # Extracting the "subject"
            part3=$(echo $EachLine | sed 's/.*\://')
            echo "Part 3: ${part3}"
            if check_conventional_commit_changelog_included "$EachLine"; then
              global_string+="- $part3"$'\n'
            else
              echo "The below commit have ${part1} commit type which is not considered for changelog."
              echo -en "${EachLine}\n"
            fi

        else
            echo "The below commit does not follow conventional commit format.so not considered for changelog."
            echo -en "${EachLine}\n"
        fi
    fi
    done <<< "$CHANGELOG"

    
    echo "-------------------------"
done

# Check if the global string is empty
if [[ -z "$global_string" ]]; then
    echo "Global string is empty. Exiting..."
    exit 1
fi

# Output the final result
echo "Global string: $global_string"

# Generate version and date strings
version=$2
date=$(date +'%Y-%m-%d')

# Create a temporary file to hold the modified content
temp_file=$(mktemp)

# Read the changelog file line by line
while IFS= read -r line; do
    echo "$line" >> "$temp_file"
    if [[ $line == "## [VERSION] - unreleased" ]]; then
        echo "## [$version] - $date" >> "$temp_file"
        echo "$global_string" >> "$temp_file"
        echo >> "$temp_file"  # Add a new line
    fi
done < "$changelog_file"

# Move the modified content back to the original file
mv "$temp_file" "$changelog_file"

echo "Strings added after '## [Unreleased]' in '$changelog_file'."
echo "Printing Updated '$changelog_file':"
cat "$changelog_file"


echo -en "${GREEN}Completed ...${NC}\n"
