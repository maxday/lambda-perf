const fs = require("fs");
const childProcess = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION;

(async () => {
  const runtimes = require("../manifest.json");

  const s3Client = new S3Client();

  for (const runtime of runtimes) {
    const path = runtime.path;
    childProcess.execSync(`./runtimes/${path}/build.sh ${path}`);
    const fileStream = fs.createReadStream(`./runtimes/${path}/code.zip`);
    const putObjectParams = {
      Bucket: `lambda-perf-${REGION}`,
      Key: `${path}/code.zip`,
      Body: fileStream,
    };
    const command = new PutObjectCommand(putObjectParams);

    try {
      await s3Client.send(command);
      console.log(`s3 upload success for ${path}`);
    } catch (e) {
      console.error(e);
    }
  }
})();
