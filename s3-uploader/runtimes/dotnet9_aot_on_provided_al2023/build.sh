DIR_NAME="./runtimes/$1"

if [ $2 = "x86_64" ]; then
    ARCH="x64"
    IMAGE_TAG="amd64"
    PLATFORM="linux/amd64"
elif [ $2 = "arm64" ]; then
    ARCH="arm64"
    IMAGE_TAG="arm64v8"
    PLATFORM="linux/arm64"
else
    echo "The process architecture $2 is set incorrectly. The value can only be either x86_64 or arm64."
    exit 1
fi

rm ${DIR_NAME}/code_${2}.zip 2> /dev/null

docker build --platform ${PLATFORM} ${DIR_NAME} --build-arg ARCH=${ARCH} --build-arg IMAGE_TAG=${IMAGE_TAG} -t maxday/dotnet9_on_provided_al2023_${2}
dockerId=$(docker create maxday/dotnet9_on_provided_al2023_${2})
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${2}.zip
