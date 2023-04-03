#/bin/bash

# Test build

set -e

GREEN='\033[0;32m'
NC='\033[0m'

#--------------------------------------------------------------------------------------------
# Build test
#--------------------------------------------------------------------------------------------

  echo -en "${GREEN}init build test ...${NC}\n"

  make release
  
# Exit prompts
echo -en "${GREEN}Done build test ...${NC}\n"
