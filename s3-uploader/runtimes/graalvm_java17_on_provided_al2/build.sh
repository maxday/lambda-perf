DIR_NAME="./runtimes/$1"
rm ${DIR_NAME}/code.zip 2> /dev/null

docker build ${DIR_NAME} -t maxday/graalvm_java17_on_provided_al2
dockerId=$(docker create maxday/graalvm_java17_on_provided_al2)
docker cp $dockerId:/code.zip ${DIR_NAME}/code.zip