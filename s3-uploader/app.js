const fs = require("fs");
const childProcess = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION;
const ARCHITECTURE = process.env.ARCHITECTURE;

(async () => {
  const manifest = require("../manifest.json");

  const s3Client = new S3Client();

  for (const runtime of manifest.runtimes) {
    for (const architecture of manifest.architectures) {
      if (architecture === ARCHITECTURE) {
        const path = runtime.path;
        console.log(
          `start building the artifact for ${path} arch = ${architecture}`
        );
        const codeFilename = `code_${architecture}.zip`;
        childProcess.execSync(
          `./runtimes/${path}/build.sh ${path} ${architecture}`
        );
        const fileStream = fs.createReadStream(
          `./runtimes/${path}/${codeFilename}`
        );
        const putObjectParams = {
          Bucket: `lambda-perf-${REGION}`,
          Key: `${path}/${codeFilename}`,
          Body: fileStream,
        };
        const command = new PutObjectCommand(putObjectParams);

        try {
          await s3Client.send(command);
          console.log(`s3 upload success for ${path} arch = ${architecture}`);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
})();
