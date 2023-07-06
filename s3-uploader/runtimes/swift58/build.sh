#!/bin/bash

DIR_NAME="./runtimes/$1"
ARCH=$2
ARCH="${ARCH/_/-}"

rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} --build-arg ARCH=${ARCH} -t maxday/swift
dockerId=$(docker create maxday/swift)

ARCH=$2
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip
