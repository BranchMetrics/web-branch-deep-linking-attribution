#!/bin/bash

[ $# -eq 0 ] && { echo "Usage: $0 1.0.0"; exit 1; }

sed -i -e "s/\"version\":.*$/\"version\": \"$1\",/" package.json
sed -i -e "s/version = '.*';$/version = '$1';/" src/0_config.js
sed -i -e "s/version = '.*';$/version = '$1';/" test/web-config.js