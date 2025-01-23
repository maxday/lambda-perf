import fs from "fs";
import childProcess from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import manifest from "../manifest.json" with { type: "json" };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendToS3 = async (region, path, codeFilename, delayInMs, nbRetry) => {
  if (nbRetry > 5) {
    throw new Error("Too many retries");
  }
  const fileStream = fs.createReadStream(`./runtimes/${path}/${codeFilename}`);
  const putObjectParams = {
    Bucket: `lambda-perf-${region}`,
    Key: `${path}/${codeFilename}`,
    Body: fileStream,
  };
  const command = new PutObjectCommand(putObjectParams);
  try {
    // we need a new client for each upload as the building process is taking time
    // and the client is getting closed / timeout
    const s3Client = new S3Client();
    await s3Client.send(command);
    console.log(`s3 upload success for ${path} codeFileName = ${codeFilename}`);
  } catch (e) {
    console.error(e);
    await sleep(delayInMs);
    await sendToS3(region, path, codeFilename, delayInMs, nbRetry + 1);
  }
};

const build = async (path, architecture, hasSpecificImageBuild, nbRetry) => {
  console.log(
    `start building the artifact for ${path} arch = ${architecture}, hasSpecificImageBuild = ${hasSpecificImageBuild} and retry = ${nbRetry}`
  );

  if (nbRetry > 5) {
    throw new Error("Too many retries");
  }
  try {
    // pruning all previous images to avoid disk space issue
    childProcess.execSync(`docker system prune --all --force`);

    childProcess.execSync(
      `./runtimes/${path}/build.sh ${path} ${architecture}`
    );

    if (hasSpecificImageBuild) {
      childProcess.execSync(
        `./runtimes/${path}/build_image.sh ${path} ${architecture}`
      );
    }
  } catch (e) {
    console.error(e);
    await build(path, architecture, hasSpecificImageBuild, nbRetry + 1);
  }
};

const upload = async (region, architecture, runtime) => {
  const SLEEP_DELAY_IN_MILLISEC = 5000;
  const path = runtime.path;
  const hasSpecificImageBuild =
    runtime.hasOwnProperty("hasSpecificImageBuild") &&
    runtime.hasSpecificImageBuild === true;
  await build(path, architecture, hasSpecificImageBuild, 0);

  let codeFilename = `code_${architecture}.zip`;
  await sendToS3(region, path, codeFilename, SLEEP_DELAY_IN_MILLISEC, 0);
  // we need to upload a different artifact if the runtime
  // has specific image build instructions
  codeFilename = `code_${architecture}_image.zip`;
  if (hasSpecificImageBuild) {
    await sendToS3(
      region,
      path,
      codeFilename,
      SLEEP_DELAY_IN_MILLISEC,
      0
    );
  }
};

const runtimeFromRuntimeId = (manifest, runtimeId) => {
  const runtime = manifest.find(r => {
    return r.path === runtimeId;
  });
  if(!runtime) {
    throw "cound not find the runtime"
  }
  console.log(runtime);
  return runtime;
}

console.log('region = ', process.env.AWS_REGION);
console.log('architecure = ', process.env.ARCHITECTURE);
console.log('runtimeId = ', process.env.RUNTIME_ID);

await upload(process.env.AWS_REGION, process.env.ARCHITECTURE, runtimeFromRuntimeId(manifest.runtimes, process.env.RUNTIME_ID));
