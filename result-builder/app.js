const { Octokit } = require("@octokit/rest");
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const commitFile = async (content, filename, authToken, owner, repo) => {
  try {
    const octokit = new Octokit({
      auth: authToken,
    });
    const b64Content = Buffer.from(content).toString("base64");
    let sha = "";
    try {
      const resultGet = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: `data/${filename}.json`,
      });
      sha = resultGet.data.sha;
    } catch (e) {
      console.log(`impossible to get the sha for ${filename}`);
    }
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `data/${filename}.json`,
      message: `perf data`,
      content: b64Content,
      sha,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateFileToPreventCaching = async (authToken, owner, repo) => {
  try {
    const octokit = new Octokit({
      auth: authToken,
    });
    const resultGet = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: `docs/script.js`,
    });
    let base64Content = resultGet.data.content;
    const sha = resultGet.data.sha;
    const textContent = Buffer.from(base64Content, "base64").toString("utf8");
    const replace = `data/last.json?${Math.random()}`;
    const newScriptJs = textContent.replace(
      /data\/last\.json\?[0-9\.]+/,
      replace
    );
    base64Content = Buffer.from(newScriptJs, "utf8").toString("base64");
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `docs/script.js`,
      message: `prevent cache`,
      content: base64Content,
      sha,
    });
  } catch (e) {
    console.error(e);
  }
};

const fetchData = async (client, table, startKey) => {
  const params = {
    TableName: table,
  };
  if (startKey) {
    params.ExclusiveStartKey = startKey;
  }

  try {
    const command = new ScanCommand(params);
    const result = await client.send(command);
    if (result.LastEvaluatedKey) {
      const data = await fetchData(client, table, result.LastEvaluatedKey);
      return [...result.Items, ...data];
    }
    return result.Items;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const buildJsonFromData = (data) => {
  const metadata = {
    generatedAt: new Date(),
  };
  const runtimeData = [];
  const packageTypes = ["zip", "image"];
  for (const packageType of packageTypes) {
    const packateTypeFilteredData = data.filter(
      (item) => item.packageType.S === packageType
    );
    let runtimes = [
      ...new Set(packateTypeFilteredData.map((item) => item.lambda.S)),
    ];
    for (const runtime of runtimes) {
      const filteredData = data.filter((e) => e.lambda.S === runtime) || [];
      let initDurations = filteredData.map((e) =>
        parseFloat(e.initDuration.N, 10)
      );
      if (initDurations.length > 10) {
        initDurations = initDurations.slice(0, 10);
      }
      const averageMemoryUsed = formatMaxThreeDigits(
        computeMean(filteredData.map((e) => parseFloat(e.maxMemoryUsed.N, 10)))
      );
      const averageDuration = formatMaxThreeDigits(
        computeMean(filteredData.map((e) => parseFloat(e.duration.N, 10)))
      );
      const averageColdStartDuration = formatMaxThreeDigits(
        computeMean(initDurations)
      );

      const displayName = filteredData[0].displayName.S;
      const memorySize = parseInt(filteredData[0].memorySize.N, 10);
      const architecture = filteredData[0].architecture.S;

      runtimeData.push({
        r: runtime,
        p: packageType,
        d: displayName,
        i: initDurations,
        m: memorySize,
        a: architecture,
        mu: averageMemoryUsed,
        ad: averageDuration,
        acd: averageColdStartDuration,
      });
    }
  }
  return { metadata, runtimeData };
};

const formatMaxThreeDigits = (number) => Math.round(number * 1e3) / 1e3;

const computeMean = (array) => array.reduce((a, b) => a + b, 0) / array.length;

exports.handler = async (_, context) => {
  const TABLE = "report-log";
  const OWNER = "maxday";
  const REPO = "lambda-perf";
  const REGION = process.env.AWS_REGION;
  const GH_AUTH_TOKEN = process.env.GH_AUTH_TOKEN;
  const IS_PRODUCTION = process.env.LAMBDA_PERF_ENV === "production";
  try {
    const dynamoDbClient = new DynamoDBClient({ region: REGION });
    const data = await fetchData(dynamoDbClient, TABLE);
    const json = buildJsonFromData(data);
    const today = new Date().toISOString().split("T")[0];
    const content = JSON.stringify(json, null, "").replace(/[\r\n]+/gm, "");
    if (IS_PRODUCTION) {
      console.log("production env detected, pushing to GitHub");
      await updateFileToPreventCaching(GH_AUTH_TOKEN, OWNER, REPO);
      await commitFile(content, today, GH_AUTH_TOKEN, OWNER, REPO);
      await commitFile(content, "last", GH_AUTH_TOKEN, OWNER, REPO);
    } else {
      console.log("non-production env detected, output the content:");
      console.log(content);
    }
  } catch (e) {
    console.error(e);
    context.fail();
  }
};
