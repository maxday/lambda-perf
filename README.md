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
- `nodejs16.x`
- `nodejs18.x`
- `nodejs20.x`
- `nodejs22.x`
- `nodejs24.x`
- `python3.8`
- `python3.9`
- `python3.10`
- `python3.11`
- `python3.12`
- `python3.13`
- `dotnet6`
- `dotnet8`
- `java11`
- `java17`
- `java21`
- `ruby3.2`
- `ruby3.3`
- `ruby3.4`

in addition to the following custom runtimes:
- `go` on `provided.al2`
- `go` on `provided.al2023`
- `rust` on `provided.al2`
- `rust` on `provided.al2023`
- `c++` on `provided.al2`
- `c++` on `provided.al2023`
- `dotnet7 aot` on `provided.al2`
- `dotnet8 aot` on `provided.al2`
- `dotnet8 aot` on `provided.al2023`
- `dotnet9 aot` on `provided.al2023`
- `quarkus native` on `provided.al2`
- `graalvm java17` on `provided.al2`
- `graalvm java21` on `provided.al2023`
- `graalvm java23` on `provided.al2023`
- `apple swift 5.8` on `provided.al2`
- `apple swift 6.2` on `provided.al2`
- `bun` on `provided.al2` (with and without layer)
- `llrt` on `provided.al2023`
- `shell` on `provided.al2`
- `shell` on `provided.al2023`

Each of this function is packaged in a zip file, uploaded to a S3 bucket.

Note that the SnapStart feature is no longer benchmarked, as using it with a simple hello-world application may not represent a meaningful use case.

### Step 2

Every day, each function is freshly grabbed from S3, deployed and invoked 10 times as cold starts.

Then the REPORT log line containing the init duration, max memory used and other useful information is saved to a DynamoDB table.

### Step 3

After all these invocations, all information stored in DynamoDB is aggregated and a new JSON file is created, then commited to this repo. ie: https://github.com/maxday/lambda-perf/blob/main/data/2022/2022-09-05.json

### Step 4

A static website, hosted on GitHub pages here: https://maxday.github.io/lambda-perf/ fetches this JSON file and displays the result in a (nice?) UI.

### Step 5

Hack/Fork/Send PR and create your own benchmarks!

## Disclaimer

⚠️ This project is not associated, affiliated, endorsed, or sponsored by any companies nor have they been reviewed tested or certified by any company.
