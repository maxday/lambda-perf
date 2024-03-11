import fs from "fs";
import childProcess from "child_process";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import manifest from "../manifest.json" assert { type: "json" };

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const buildDockerImage = async (
  accountId,
  s3Client,
  region,
  runtime,
  architecture,
  hasSpecificImageBuild,
  delayInMs
) => {
  await getFromS3(
    s3Client,
    region,
    runtime.path,
    architecture,
    hasSpecificImageBuild,
    delayInMs,
    0
  );
  if (
    fs.existsSync(runtime.path) &&
    runtime.path !== "." &&
    runtime.path !== ".." &&
    runtime.path !== "/"
  ) {
    fs.rmSync(runtime.path, { recursive: true, force: true });
  }
  childProcess.execSync(
    `unzip ${runtime.path}_${architecture}.zip -d ${runtime.path}`
  );
  const tag = `${accountId}.dkr.ecr.${region}.amazonaws.com/lambda-perf:${runtime.path}-${architecture}`;
  const cmdLine = `docker build . -f Dockerfile.sample -t ${tag} --build-arg baseImage='${runtime.image.baseImage}' --build-arg handlerCode='${runtime.path}' --build-arg handlerCmd='${runtime.handler}'`;
  childProcess.execSync(cmdLine);
  const cmdLogin = `aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${accountId}.dkr.ecr.${region}.amazonaws.com`;
  console.log("docker logging in!");
  childProcess.execSync(cmdLogin);
  console.log("docker logged in!");
  childProcess.execSync(`docker push ${tag}`);
  console.log("image pushed!");
};

const getFromS3 = async (
  client,
  region,
  path,
  architecture,
  hasSpecificImageBuild,
  delayInMs,
  nbRetry
) => {
  console.log("retrieving the code package from S3");
  if (nbRetry > 5) {
    throw new Error("Too many retries");
  }

  const codeFilename = hasSpecificImageBuild
    ? `code_${architecture}_image.zip`
    : `code_${architecture}.zip`;

  const getObjectParams = {
    Bucket: `lambda-perf-${region}`,
    Key: `${path}/${codeFilename}`,
  };
  const command = new GetObjectCommand(getObjectParams);
  try {
    const { Body } = await client.send(command);
    console.log(`s3 retrieve success for ${path} arch = ${architecture}`);
    // write to file
    const filePath = `${path}_${architecture}.zip`;
    await new Promise((resolve, reject) => {
      Body.pipe(fs.createWriteStream(filePath))
        .on("error", (err) => reject(err))
        .on("close", () => resolve());
    });
  } catch (e) {
    console.error(e);
    await sleep(delayInMs);
    await getFromS3(
      client,
      region,
      path,
      architecture,
      hasSpecificImageBuild,
      delayInMs,
      nbRetry + 1
    );
  }
};

const run = async () => {
  const REGION = process.env.AWS_REGION;
  const ACCOUNT_ID = process.env.ACCOUNT_ID;
  const ARCHITECTURE = process.env.ARCHITECTURE;
  const SLEEP_DELAY_IN_MILLISEC = 5000;

  const s3Client = new S3Client();
  for (const runtime of manifest.runtimes) {
    console.log(runtime);
    for (const architecture of runtime.architectures) {
      console.log(architecture);
      if (architecture === ARCHITECTURE) {
        console.log("building image");
        if (runtime.hasOwnProperty("image")) {
          const hasSpecificImageBuild =
            runtime.hasOwnProperty("hasSpecificImageBuild") &&
            runtime.hasSpecificImageBuild === true;
          await buildDockerImage(
            ACCOUNT_ID,
            s3Client,
            REGION,
            runtime,
            architecture,
            hasSpecificImageBuild,
            SLEEP_DELAY_IN_MILLISEC
          );
        }
      }
    }
  }
};

await run();
