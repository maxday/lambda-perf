SOURCE=${BASH_SOURCE[0]}
DIR_NAME=$(dirname ${SOURCE})
rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/go1x
dockerId=$(docker create maxday/go1x)
docker cp $dockerId:/code.zip ${DIR_NAME}/code.zip