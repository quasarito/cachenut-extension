#!/bin/bash

# Utility to output the hash of the extension bundle
# Given a folder or a zip file bundle containing the extension files, a hash
# will be computed from all the extensions files combined.
# If run without any arguments, hashes for all zip bundles found in the
# extension folder are computed.
# Requires: sha1sum, sha256deep, unzip
#
# Usage: hash-check.sh [file|folder]

which sha256deep > /dev/null 2>&1
if [ "$?" != "0" ]; then
  echo "Missing sha256deep command"
  MISSING_EXEC="true"
fi

which unzip > /dev/null 2>&1
if [ "$?" != "0" ]; then
  echo "Missing unzip command"
  MISSING_EXEC="true"
fi

which sha1sum > /dev/null 2>&1
if [ "$?" == "0" ]; then
  SHASUM_EXEC="sha1sum"
else
  which shasum > /dev/null 2>&1 # macos has shasum included
  if [ "$?" == "0" ]; then
    SHASUM_EXEC="shasum -a 1"
  else
    echo "Missing sha1sum command"
    MISSING_EXEC="true"
  fi
fi

if [ "$MISSING_EXEC" == "true" ]; then
  exit 1
fi

function do_hash_folder() {
  FOLDER="$1"
  pushd $FOLDER > /dev/null
  echo $(sha256deep -rl * | sort | $SHASUM_EXEC)
  popd > /dev/null
}

function do_hash_zip() {
  ZIP_FILE="$1"
  TMP_FOLDER=$(mktemp -d)
  unzip -q $1 -d $TMP_FOLDER
  do_hash_folder $TMP_FOLDER
}

if [ -z "$1" ]; then
  for BUNDLE in $(ls -1 extension/*.zip extension/*.xpi extension/*.crx); do
    if [ -f $BUNDLE ]; then
      echo $(do_hash_zip $BUNDLE) $BUNDLE
    fi
  done
elif [ -d "$1" ]; then
  do_hash_folder $1
else
  do_hash_zip $1
fi
