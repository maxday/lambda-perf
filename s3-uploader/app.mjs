import fs from "fs";
import childProcess from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import manifest from "../manifest.json" assert { type: "json" };

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendToS3 = async (
  client,
  region,
  path,
  architecture,
  delayInMs,
  nbRetry
) => {
  if (nbRetry > 5) {
    throw new Error("Too many retries");
  }
  const codeFilename = `code_${architecture}.zip`;
  const fileStream = fs.createReadStream(`./runtimes/${path}/${codeFilename}`);
  const putObjectParams = {
    Bucket: `lambda-perf-${region}`,
    Key: `${path}/${codeFilename}`,
    Body: fileStream,
  };
  const command = new PutObjectCommand(putObjectParams);
  try {
    await client.send(command);
    console.log(`s3 upload success for ${path} arch = ${architecture}`);
  } catch (e) {
    console.error(e);
    await sleep(delayInMs);
    await sendToS3(client, region, path, architecture, delayInMs, nbRetry + 1);
  }
};

const build = async (path, architecture, nbRetry) => {
  if (nbRetry > 5) {
    throw new Error("Too many retries");
  }
  try {
    childProcess.execSync(
      `./runtimes/${path}/build.sh ${path} ${architecture}`
    );
  } catch (e) {
    console.error(e);
    await build(path, architecture, nbRetry + 1);
  }
};

const upload = async () => {
  const REGION = process.env.AWS_REGION;
  const ARCHITECTURE = process.env.ARCHITECTURE;
  const SLEEP_DELAY_IN_MILLISEC = 5000;

  const s3Client = new S3Client();
  for (const runtime of manifest.runtimes) {
    for (const architecture of runtime.architectures) {
      if (architecture === ARCHITECTURE) {
        const path = runtime.path;
        console.log(
          `start building the artifact for ${path} arch = ${architecture}`
        );
        await build(path, architecture, 0);
        await sendToS3(
          s3Client,
          REGION,
          path,
          architecture,
          SLEEP_DELAY_IN_MILLISEC,
          0
        );
      }
    }
  }
};

await upload();
