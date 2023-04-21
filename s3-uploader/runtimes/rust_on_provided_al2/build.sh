#!/bin/bash

DIR_NAME="./runtimes/$1"
ARCH=$2
ARCH="${ARCH/_/-}"

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null
cd ${DIR_NAME}
cargo lambda build --release --${ARCH}

ARCH=$2
zip -j code_${ARCH}.zip target/lambda/lambda-perf/bootstrap