DIR_NAME="./runtimes/$1"
ARCH=$2

if [ $2 = "x86_64" ]; then
    ARCH_PLATFORM="linux/amd64"
elif [ $2 = "arm64" ]; then
    ARCH_PLATFORM="linux/arm64"
else
    echo "The process architecture $2 is set incorrectly. The value can only be either x86_64 or arm64."
    exit 1
fi

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build --platform ${ARCH_PLATFORM} ${DIR_NAME} -t maxday/deno
dockerId=$(docker create maxday/deno)
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip
