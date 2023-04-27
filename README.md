# 🔄 Continous Lambda Cold Starts Benchmark 

**TL;DR:** 👀 to https://maxday.github.io/lambda-perf/

to see the benchmark result: 

![screenshot](https://github.com/maxday/lambda-perf/blob/main/docs/screenshot.png)

## Why?

There are already a lot of blog posts talking about Lambda Cold Starts performance per runtime but I could not find any always up-to-date information. 

That's why I decided to create this project: data is always up to date as the benchmark is running daily.

## How does it work?

### Architecture diagram

![architecture](https://github.com/maxday/lambda-perf/blob/main/docs/architecture.png?raw=true)

### Step 1
An ultra simple hello-world function has been written in each AWS supported runtime:
- `nodejs12.x`
- `nodejs14.x`
- `nodejs16.x`
- `nodejs18.x`
- `python3.7`
- `python3.8`
- `python3.9`
- `python3.10`
- `dotnetcore3.1`
- `dotnet6`
- `go1.x`
- `java11`
- `java11 + snapstart`
- `java17`
- `java17 + snapstart`
- `java8`
- `ruby2.7`

in addition to 5 custom runtimes:
- `go` on `provided`
- `go` on `provided.al2`
- `rust` on `provided.al2`
- `dotnet7 aot` on `provided.al2`
- `quarkus native` on `provided.al2`
- `graalvm java17` on `provided.al2`

Each of this function is packaged in a zip file, uploaded to a S3 bucket.

### Step 2

Every day, each function is freshly grabbed from S3, deployed and invoked 10 times as cold starts.

Then the REPORT log line containing the init duration, max memory used and other useful information is saved to a DynamoDB table.

### Step 3

After all these invocations, all information stored in DynamoDB is aggregated and a new JSON file is created, then commited to this repo. ie: https://github.com/maxday/lambda-perf/blob/main/data/2022-09-05.json

### Step 4

A static website, hosted on GitHub pages here: https://maxday.github.io/lambda-perf/ fetches this JSON file and displays the result in a (nice?) UI.

### Step 5

Hack/Fork/Send PR and create your own benchmarks!

## Disclaimer

⚠️ This project is not associated, affiliated, endorsed, or sponsored by any companies nor have they been reviewed tested or certified by any company.
