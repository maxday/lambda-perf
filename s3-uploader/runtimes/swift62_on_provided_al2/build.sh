#!/bin/bash

DIR_NAME="./runtimes/$1"

if [ $2 = "x86_64" ]; then
    ARCH="linux/amd64"
elif [ $2 = "arm64" ]; then
    ARCH="linux/arm64/v8"
else
    echo "The process architecture $2 is set incorrectly. The value can only be either x86_64 or arm64."
    exit 1
fi

rm ${DIR_NAME}/code_${2}.zip 2> /dev/null

docker build ${DIR_NAME} --platform ${ARCH} -t maxday/swift62_on_provided_al2_${2}
dockerId=$(docker create maxday/swift62_on_provided_al2_${2})

docker cp $dockerId:/code.zip ${DIR_NAME}/code_${2}.zip
