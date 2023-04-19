const zlib = require("zlib");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const dynamoDb = DynamoDBDocument.from(new DynamoDB());

const TABLE = "report-log";

const runtimes = require("../manifest.json");

exports.handler = async (input, context) => {
  let payload = Buffer.from(input.awslogs.data, "base64");
  let result = zlib.gunzipSync(payload);
  result = JSON.parse(result.toString());
  const fromLambda = result.logGroup.replace("/aws/lambda/", "");
  const originalPath = fromLambda.replace("lambda-perf-", "");
  const filter = runtimes.filter((e) => e.path === originalPath);
  if (filter.length !== 1) {
    // could not find the display name
    context.fail();
  }
  const displayName = filter[0].displayName;
  console.log("display name = ", displayName);
  for (const singleEvent of result.logEvents) {
    try {
      const reportLogRegex =
        /REPORT RequestId: (?<requestId>[a-z0-9\-]+)\s*Duration: (?<durationTime>[0-9\.]+) ms\s*Billed Duration: (?<billedDurationTime>[0-9\.]+) ms\s*Memory Size: (?<memorySize>[0-9\.]+) MB\s*Max Memory Used: (?<maxMemoryUsed>[0-9\.]+) MB\s*(Init Duration: (?<initDuration>[0-9\.]+) ms\s*)?\s*(Restore Duration: (?<restoreDuration>[0-9\.]+) ms\s*Billed Restore Duration: (?<billedRestoreDuration>[0-9\.]+) ms\s*)?/g;
      const match = reportLogRegex.exec(singleEvent.message);
      if (match) {
        const {
          requestId,
          durationTime,
          billedDurationTime,
          memorySize,
          maxMemoryUsed,
          initDuration,
          restoreDuration,
          billedRestoreDuration,
        } = match.groups;
        const item = {
          requestId,
          lambda: fromLambda,
          displayName,
          duration: durationTime,
          billedDuratation: billedDurationTime,
          memorySize,
          maxMemoryUsed,
          initDuration: initDuration ?? restoreDuration,
          restoreDuration: restoreDuration ?? 0,
          billedRestoreDuration: billedRestoreDuration ?? 0,
        };
        await dynamoDb.put({
          TableName: TABLE,
          Item: item,
        });
      }
    } catch (e) {
      console.error(e);
      context.fail();
    }
  }
  context.succeed();
};
