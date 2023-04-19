DIR_NAME="./runtimes/$1"
rm ${DIR_NAME}/code.zip 2> /dev/null
zip -j ${DIR_NAME}/code.zip ${DIR_NAME}/index.py