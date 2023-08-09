DIR_NAME="./runtimes/$1"
ARCH=$2

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker buildx build --platform linux/arm64 ${DIR_NAME} --build-arg ARCH=${ARCH} -t maxday/dotnet7 {$DIR_NAME} --load
dockerId=$(docker create maxday/dotnet7)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip