SOURCE=${BASH_SOURCE[0]}
DIR_NAME=$(dirname ${SOURCE})
rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/dotnetcore31
dockerId=$(docker create maxday/dotnetcore31)
docker cp $dockerId:/code.zip ${DIR_NAME}/code.zip