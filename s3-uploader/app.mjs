import fs from "fs";
import childProcess from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import manifest from "../manifest.json" assert { type: "json" };

const REGION = process.env.AWS_REGION;
const ARCHITECTURE = process.env.ARCHITECTURE;
const SLEEP_DELAY_IN_SEC = 5;

export const sleep = (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const sendToS3 = async (client, path, architecture, nbRetry) => {
  if (nbRetry > 5) {
    throw new Error("Too many retries");
  }
  const codeFilename = `code_${architecture}.zip`;
  const fileStream = fs.createReadStream(`./runtimes/${path}/${codeFilename}`);
  const putObjectParams = {
    Bucket: `lambda-perf-${REGION}`,
    Key: `${path}/${codeFilename}`,
    Body: fileStream,
  };
  const command = new PutObjectCommand(putObjectParams);
  try {
    await client.send(command);
    console.log(`s3 upload success for ${path} arch = ${architecture}`);
  } catch (e) {
    console.error(e);
    await sleep(SLEEP_DELAY_IN_SEC);
    await sendToS3(client, path, architecture, nbRetry + 1);
  }
};

const upload = async () => {
  const s3Client = new S3Client();
  for (const runtime of manifest.runtimes) {
    for (const architecture of runtime.architectures) {
      if (architecture === ARCHITECTURE) {
        const path = runtime.path;
        console.log(
          `start building the artifact for ${path} arch = ${architecture}`
        );
        childProcess.execSync(
          `./runtimes/${path}/build.sh ${path} ${architecture}`
        );
        //await sendToS3(s3Client, path, architecture, 0);
      }
    }
  }
};

await upload();
