DIR_NAME="./runtimes/$1"
ARCH=$2

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/graalvm-java21_on_provided_al2
dockerId=$(docker create maxday/graalvm-java21_on_provided_al2)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip