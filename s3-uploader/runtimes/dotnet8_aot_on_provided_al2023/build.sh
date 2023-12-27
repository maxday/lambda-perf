DIR_NAME="./runtimes/$1"
ARCH=$2

if [ $2 = "x86_64" ]; then
    TAG_SUFFIX=""
elif [ $2 = "arm64" ]; then
    TAG_SUFFIX="-arm64"
else
    echo "The process architecture $2 is set incorrectly. The value can only be either x86_64 or arm64."
    exit 1
fi

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

docker build ${DIR_NAME} --build-arg ARCH=${ARCH} --build-arg TAG_SUFFIX="${TAG_SUFFIX}" -t maxday/dotnet8-aot_${ARCH}
dockerId=$(docker create maxday/dotnet8-aot_${ARCH})
docker cp $dockerId:/code.zip ${DIR_NAME}/code_${ARCH}.zip