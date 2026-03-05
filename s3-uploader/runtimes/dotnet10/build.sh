DIR_NAME="./runtimes/$1"
ARCH=$2

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build ${DIR_NAME} --build-arg ARCH=${ARCH} -t maxday/dotnet10
dockerId=$(docker create maxday/dotnet10)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip