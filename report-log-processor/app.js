const zlib = require('zlib');
const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient;
const dynamoDb = new DocumentClient();

exports.handler = async (input, context) => {
    console.log(input);
    var payload = Buffer.from(input.awslogs.data, 'base64');
    var result = zlib.gunzipSync(payload);
    result = JSON.parse(result.toString());
    const fromLambda = result.logGroup.replace("/aws/lambda/", "");
    for (const singleEvent of result.logEvents) {
        try {
            const reportLogRegex = /REPORT RequestId: ([a-z0-9\-]+)\s*Duration: ([0-9\.]+) ms\s*Billed Duration: ([0-9\.]+) ms\s*Memory Size: ([0-9\.]+) MB\s*Max Memory Used: ([0-9\.]+) MB\s*(Init Duration: ([0-9\.]+) ms\s*)?\s*/g
            const match = reportLogRegex.exec(singleEvent.message);
            if (match) {
                const item = {
                    requestId: match[1],
                    lambda: fromLambda,
                    duration: match[2],
                    billedDuratation: match[3],
                    memorySize: match[4],
                    maxMemoryUsed: match[5],
                    initDuration: match[7]
                }
                await dynamoDb
                    .put({
                        TableName: process.env.REPORT_TABLE_NAME,
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