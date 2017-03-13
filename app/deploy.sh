#!/bin/bash

set -e

if [ ! -d node_modules ]; then
  npm install
fi

node_modules/webpack/bin/webpack.js
cd dist

index_html_hash=$(ipfs add -q index.html)
app_bundle_hash=$(ipfs add -q assets/app.bundle.js)

empty_dir=$(ipfs object new unixfs-dir)
assets_dir=$(ipfs object patch $empty_dir add-link app.bundle.js $app_bundle_hash)
dir=$(ipfs object patch $empty_dir add-link index.html $index_html_hash)
dir=$(ipfs object patch $dir add-link assets $assets_dir)
echo $dir
