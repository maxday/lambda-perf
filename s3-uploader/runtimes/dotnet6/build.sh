DIR_NAME="./runtimes/$1"
rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/dotnet6
dockerId=$(docker create maxday/dotnet6)
docker cp $dockerId:/code.zip ${DIR_NAME}/code.zip