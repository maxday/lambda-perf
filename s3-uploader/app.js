const fs = require('fs');
const childProcess = require('child_process');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

(async () => {
    const runtimes = [
        'nodejs12x', 
        'nodejs14x', 
        'nodejs16x', 
        'nodejs18x', 
        'python37',
        'python38',
        'python39',
        'dotnetcore31',
        'dotnet6',
        'go1x',
        'java11',
        'java8',
        'ruby27',
        'go_on_provided',
        'rust_on_provided_al2'
    ];

    const s3Client = new S3Client();

    for(const runtime of runtimes) {
        childProcess.execSync(`./runtimes/${runtime}/build.sh`);
        const fileStream = fs.createReadStream(`./runtimes/${runtime}/code.zip`);
        const putObjectParams = {
            Bucket: 'lambda-perf',
            Key: `${runtime}/code.zip`,
            Body: fileStream,
          };
        const command = new PutObjectCommand(putObjectParams);

        try {
            await s3Client.send(command);
            console.log(`s3 upload success for ${runtime}`);
        } catch (e) {
            console.error(e);
        }
    }
})();