SOURCE=${BASH_SOURCE[0]}
DIR_NAME=$(dirname ${SOURCE})
rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/quarkus-native-on-provided-al2 --platform=linux/amd64
dockerId=$(docker create maxday/quarkus-native-on-provided-al2)
docker cp $dockerId:/code.zip ${DIR_NAME}/code.zip