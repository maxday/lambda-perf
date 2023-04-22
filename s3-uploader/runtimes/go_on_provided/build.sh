DIR_NAME="./runtimes/$1"
ARCH=$2

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/go-on-provided
dockerId=$(docker create maxday/go-on-provided)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip