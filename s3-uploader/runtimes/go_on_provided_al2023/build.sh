#!/bin/bash

DIR_NAME="./runtimes/$1"
ARCH=$2
ARCH="${ARCH/x86_/amd}"

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build ${DIR_NAME} --build-arg ARCH=${ARCH} -t maxday/go-on-provided-al2023_$2
dockerId=$(docker create maxday/go-on-provided-al2023_$2)

ARCH=$2
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip