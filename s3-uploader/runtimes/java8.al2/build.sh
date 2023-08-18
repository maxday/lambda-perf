DIR_NAME="./runtimes/$1"
ARCH=$2

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/java8.al2
dockerId=$(docker create maxday/java8.al2)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip