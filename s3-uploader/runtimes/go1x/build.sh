DIR_NAME="./runtimes/$1"
ARCH=$2
ARCH="${ARCH/x86_/amd}"

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build ${DIR_NAME} --build-arg ARCH=${ARCH} -t maxday/go1x
dockerId=$(docker create maxday/go1x)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip