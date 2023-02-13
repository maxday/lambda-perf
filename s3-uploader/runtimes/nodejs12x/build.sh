SOURCE=${BASH_SOURCE[0]}
DIR_NAME=$(dirname ${SOURCE})
rm ${DIR_NAME}/code.zip 2> /dev/null
zip -j ${DIR_NAME}/code.zip ${DIR_NAME}/index.js