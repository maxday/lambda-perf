#!/bin/bash
RUNTIME_NAME=$1
ARCH=$2
BUILD_TYPE=$3

#Get the latest version name by following the redirect URL
URL="https://github.com/awslabs/llrt/releases/latest/";
REDIRECT_URL=$(curl "$URL" -s -L -I -o /dev/null -w '%{url_effective}')
VERSION=$(echo $REDIRECT_URL | awk -F'/' '{print $NF}')


DIR_NAME="./runtimes/$RUNTIME_NAME"

if [ $ARCH = "x86_64" ]; then
    ARCH="x64"
elif [ $ARCH = "arm64" ]; then
    ARCH="arm64"
else
    echo "The process architecture $2 is set incorrectly. The value can only be either x86_64 or arm64."
    exit 1
fi

rm ${DIR_NAME}/llrt-container* 2> /dev/null
rm ${DIR_NAME}/llrt-lambda* 2> /dev/null
rm ${DIR_NAME}/bootstrap 2> /dev/null


if [ $BUILD_TYPE = "zip" ]; then
    ARTIFACT_NAME="llrt-lambda-${ARCH}.zip"
    URL="https://github.com/awslabs/llrt/releases/download/${VERSION}/${ARTIFACT_NAME}"
    curl -L ${URL} > ${DIR_NAME}/${ARTIFACT_NAME}
    unzip ${DIR_NAME}/llrt-lambda-${ARCH} -d ${DIR_NAME}
    zip -j ${DIR_NAME}/code_${2}.zip ${DIR_NAME}/index.mjs
    zip -j ${DIR_NAME}/code_${2}.zip ${DIR_NAME}/bootstrap
else
    ARTIFACT_NAME="llrt-container-${ARCH}"
    URL="https://github.com/awslabs/llrt/releases/download/${VERSION}/${ARTIFACT_NAME}"
    curl -L ${URL} > ${DIR_NAME}/bootstrap
    zip -j ${DIR_NAME}/code_${2}_${BUILD_TYPE}.zip ${DIR_NAME}/index.mjs
    zip -j ${DIR_NAME}/code_${2}_${BUILD_TYPE}.zip ${DIR_NAME}/bootstrap
fi

