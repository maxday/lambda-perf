SOURCE=${BASH_SOURCE[0]}
DIR_NAME=$(dirname ${SOURCE})
rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/java11
dockerId=$(docker create maxday/java11)
docker cp $dockerId:/code.zip ${DIR_NAME}/code.zip