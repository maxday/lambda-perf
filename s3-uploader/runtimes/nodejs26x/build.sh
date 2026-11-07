DIR_NAME="./runtimes/$1"
ARCH=$2

rm ${DIR_NAME}/code_${ARCH}.zip 2> /dev/null

zip -j ${DIR_NAME}/code_${ARCH}.zip ${DIR_NAME}/index.js