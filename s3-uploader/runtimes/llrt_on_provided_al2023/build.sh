#!/bin/bash

## TODO: find a way to make this more generic
LATEST_RELEASE="v0.1.5-beta"

DIR_NAME="./runtimes/$1"

if [ $2 = "x86_64" ]; then
    ARCH="x64"
elif [ $2 = "arm64" ]; then
    ARCH="arm64"
else
    echo "The process architecture $2 is set incorrectly. The value can only be either x86_64 or arm64."
    exit 1
fi

rm ${DIR_NAME}/code_${2}.zip 2> /dev/null
rm ${DIR_NAME}/llrt-lambda*.zip 2> /dev/null
rm ${DIR_NAME}/bootstrap 2> /dev/null

# Download the release from github
URL="https://github.com/awslabs/llrt/releases/download/${LATEST_RELEASE}/llrt-lambda-${ARCH}.zip"
curl -L ${URL} > ${DIR_NAME}/llrt-lambda-${ARCH}.zip
unzip ${DIR_NAME}/llrt-lambda-${ARCH} -d ${DIR_NAME}

zip -j ${DIR_NAME}/code_${2}.zip ${DIR_NAME}/index.mjs
zip -j ${DIR_NAME}/code_${2}.zip ${DIR_NAME}/bootstrap