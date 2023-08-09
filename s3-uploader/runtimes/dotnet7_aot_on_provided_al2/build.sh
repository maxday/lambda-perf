DIR_NAME="./runtimes/$1"
ARCH=$2

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker buildx create --name multiarch --platform linux/arm64
docker buildx build --load --platform linux/arm64  --builder multiarch ${DIR_NAME} --build-arg ARCH=${ARCH} -t maxday/dotnet7
dockerId=$(docker create maxday/dotnet7)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip