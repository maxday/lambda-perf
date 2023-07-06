#!/bin/bash

DIR_NAME="./runtimes/$1"
ARCH=$2
ARCH="${ARCH/_/-}"

rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/cpp
dockerId=$(docker create maxday/cpp)

ARCH=$2
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip