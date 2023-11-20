#!/bin/bash

DIR_NAME="./runtimes/$1"
ARCH=$2
ARCH="${ARCH/_/-}"

rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} --build-arg ARCH=${ARCH} -t maxday/rust_on_provided_al2023_${2}
dockerId=$(docker create maxday/rust_on_provided_al2023_${2})

ARCH=$2
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip