const zlib = require("zlib");
const DocumentClient = require("aws-sdk/clients/dynamodb").DocumentClient;
const dynamoDb = new DocumentClient();

const TABLE = "report-log";

exports.handler = async (input, context) => {
  var payload = Buffer.from(input.awslogs.data, "base64");
  var result = zlib.gunzipSync(payload);
  result = JSON.parse(result.toString());
  const fromLambda = result.logGroup.replace("/aws/lambda/", "");
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
          requestId: requestId,
          lambda: fromLambda,
          duration: durationTime,
          billedDuratation: billedDurationTime,
          memorySize: memorySize,
          maxMemoryUsed: maxMemoryUsed,
          initDuration: initDuration ?? restoreDuration,
          restoreDuration: restoreDuration,
          billedRestoreDuration: billedRestoreDuration,
        };
        await dynamoDb
          .put({
            TableName: TABLE,
            Item: item,
          })
          .promise();
        console.log("item inserted");
      }
    } catch (e) {
      console.error(e);
      context.fail();
    }
  }
  context.succeed();
};
