const dataManager = {
  fetchData: null,
};

// const load = async (dataManager) => {
//   const request = await fetch(
//     "https://raw.githubusercontent.com/maxday/lambda-perf/main/data/last.json?0.6364339785884603"
//   );
//   const json = await request.json();
//   dataManager.fetchData = json;
// };

const load = async (dataManager) => {
  const json = {
    metadata: {
      generatedAt: "2023-04-21T21:19:44.442Z",
    },
    runtimeData: [
      {
        runtime: "lambda-perf-dotnet6-512-arm64",
        displayName: "dotnet6",
        initDurations: [
          271.56, 257.92, 271.06, 255.38, 251.53, 251.89, 264.27, 256.7, 259.52,
          261.23,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 62.2,
        averageDuration: 168.622,
        averageColdStartDuration: 260.106,
      },
      {
        runtime: "lambda-perf-java11-1024-arm64",
        displayName: "java11",
        initDurations: [
          461.03, 444.42, 477.7, 456.73, 457.69, 441.28, 451.18, 451.75, 445.68,
          465.13,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 72,
        averageDuration: 8.675,
        averageColdStartDuration: 455.259,
      },
      {
        runtime: "lambda-perf-graalvm_java17_on_provided_al2-512-x86_64",
        displayName: "graalvm java17 (prov.al2)",
        initDurations: [
          130.29, 124.43, 127.19, 160.22, 122.89, 122.8, 127.16, 176.07, 121.46,
          132.3,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 34,
        averageDuration: 10.645,
        averageColdStartDuration: 134.481,
      },
      {
        runtime: "lambda-perf-dotnet7_aot_on_provided_al2-1024-x86_64",
        displayName: "dotnet7 aot (prov.al2)",
        initDurations: [
          112.95, 108.54, 103.27, 111.26, 108.56, 107.06, 107.08, 206.38,
          103.85, 108.4,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 34,
        averageDuration: 7.409,
        averageColdStartDuration: 117.735,
      },
      {
        runtime: "lambda-perf-ruby27-512-arm64",
        displayName: "ruby2.7",
        initDurations: [
          155.7, 148.36, 149.75, 151.61, 147.1, 149.82, 148.98, 146.38, 150.87,
          152.89,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 30,
        averageDuration: 2.46,
        averageColdStartDuration: 150.146,
      },
      {
        runtime: "lambda-perf-nodejs16x-256-x86_64",
        displayName: "nodejs16.x",
        initDurations: [
          151.45, 154.9, 149.23, 144.71, 149.44, 152.35, 147.14, 171.89, 144.33,
          165.19,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 58,
        averageDuration: 2.477,
        averageColdStartDuration: 153.063,
      },
      {
        runtime: "lambda-perf-nodejs14x-512-x86_64",
        displayName: "nodejs14.x",
        initDurations: [
          168.87, 166.26, 172.09, 139.23, 172.93, 177.27, 166.08, 172.81,
          236.88, 184.96,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 57,
        averageDuration: 2.371,
        averageColdStartDuration: 175.738,
      },
      {
        runtime: "lambda-perf-python310-128-x86_64",
        displayName: "python3.10",
        initDurations: [
          150.9, 102.23, 123.18, 82.99, 115.47, 135.18, 109.36, 109.64, 108.16,
          101.91,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.295,
        averageColdStartDuration: 113.902,
      },
      {
        runtime: "lambda-perf-quarkus_native_on_provided_al2-1024-x86_64",
        displayName: "quarkus (prov.al2)",
        initDurations: [
          230.83, 272.33, 267.11, 242.65, 236.44, 203.11, 260.35, 259.73,
          250.09, 235.05,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 55,
        averageDuration: 24.251,
        averageColdStartDuration: 245.769,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-128-x86_64",
        displayName: "rust (prov.al2)",
        initDurations: [
          13.53, 14.91, 13.89, 14.4, 15.16, 13.98, 14.44, 16.08, 16.54, 16.23,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 13.2,
        averageDuration: 1.021,
        averageColdStartDuration: 14.916,
      },
      {
        runtime: "lambda-perf-dotnetcore31-128-arm64",
        displayName: "dotnetcore3.1",
        initDurations: [
          167.79, 175.59, 174.75, 180.5, 175.63, 180.05, 162.62, 178.97, 166.44,
          183.41,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 53,
        averageDuration: 279.887,
        averageColdStartDuration: 174.575,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-128-arm64",
        displayName: "rust (prov.al2)",
        initDurations: [
          12.33, 11.59, 11.71, 12.14, 12.36, 11.34, 12.94, 11.48, 12, 11.72,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 13,
        averageDuration: 1.123,
        averageColdStartDuration: 11.961,
      },
      {
        runtime: "lambda-perf-go_on_provided-1024-x86_64",
        displayName: "go (provided)",
        initDurations: [
          51.8, 50.91, 54.59, 53.41, 53.97, 53.03, 71.63, 55.2, 51.08, 52.03,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 19,
        averageDuration: 1.518,
        averageColdStartDuration: 54.765,
      },
      {
        runtime: "lambda-perf-java11_snapstart-512-x86_64",
        displayName: "java11 snapstart",
        initDurations: [
          185.43, 159.99, 228.08, 180.29, 159.26, 123.49, 156.27, 200.48,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 66.875,
        averageDuration: 27.903,
        averageColdStartDuration: 174.161,
      },
      {
        runtime: "lambda-perf-python38-128-x86_64",
        displayName: "python3.8",
        initDurations: [
          114.01, 97.89, 117.92, 134.64, 115.13, 165.81, 110.97, 112.94, 113.85,
          116.18,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 38,
        averageDuration: 1.479,
        averageColdStartDuration: 119.934,
      },
      {
        runtime: "lambda-perf-go_on_provided-128-x86_64",
        displayName: "go (provided)",
        initDurations: [
          53.18, 55.49, 51.87, 52.5, 55.01, 51.74, 50.83, 51.83, 51.61, 57.86,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 19,
        averageDuration: 1.542,
        averageColdStartDuration: 53.192,
      },
      {
        runtime: "lambda-perf-nodejs12x-1024-arm64",
        displayName: "nodejs12.x",
        initDurations: [
          157.11, 171.51, 174.04, 168.55, 182.46, 160.96, 168.97, 163.19,
          164.98, 165.41,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 54,
        averageDuration: 3.291,
        averageColdStartDuration: 167.718,
      },
      {
        runtime: "lambda-perf-python37-512-x86_64",
        displayName: "python3.7",
        initDurations: [
          121.75, 109.11, 113.39, 111.95, 111.67, 110.62, 113.92, 112.71, 91.31,
          138.93,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 36.1,
        averageDuration: 1.874,
        averageColdStartDuration: 113.536,
      },
      {
        runtime: "lambda-perf-nodejs14x-512-arm64",
        displayName: "nodejs14.x",
        initDurations: [
          190.66, 174.36, 178.75, 178.4, 170.44, 182.57, 175.32, 193.35, 192.74,
          189.01,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 56,
        averageDuration: 3.23,
        averageColdStartDuration: 182.56,
      },
      {
        runtime: "lambda-perf-nodejs14x-256-x86_64",
        displayName: "nodejs14.x",
        initDurations: [
          176.54, 179.89, 169.13, 176.36, 163.72, 177.47, 168.11, 171.39,
          166.34, 172.19,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 56.8,
        averageDuration: 3.547,
        averageColdStartDuration: 172.114,
      },
      {
        runtime: "lambda-perf-nodejs14x-128-x86_64",
        displayName: "nodejs14.x",
        initDurations: [
          163.84, 175.62, 166.95, 167.59, 165.47, 166.37, 207.99, 168.23,
          168.38, 173.44,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 56.9,
        averageDuration: 13.971,
        averageColdStartDuration: 172.388,
      },
      {
        runtime: "lambda-perf-java11-256-arm64",
        displayName: "java11",
        initDurations: [
          453.18, 467.37, 451.1, 440.14, 454.54, 466.21, 446.77, 471.44, 470.34,
          454.17,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 70.1,
        averageDuration: 42.902,
        averageColdStartDuration: 457.526,
      },
      {
        runtime: "lambda-perf-python310-256-arm64",
        displayName: "python3.10",
        initDurations: [
          104.72, 106.49, 110.13, 107.25, 108.34, 106.29, 110.14, 111.61,
          112.66, 108.15,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 35,
        averageDuration: 1.319,
        averageColdStartDuration: 108.578,
      },
      {
        runtime: "lambda-perf-nodejs12x-128-arm64",
        displayName: "nodejs12.x",
        initDurations: [
          161.3, 159.34, 170.61, 158.79, 175.01, 179.43, 168.13, 165.82, 168.31,
          158.95,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 54,
        averageDuration: 10.487,
        averageColdStartDuration: 166.569,
      },
      {
        runtime: "lambda-perf-java11-512-x86_64",
        displayName: "java11",
        initDurations: [
          457.49, 452.95, 464.18, 446.66, 456.77, 489.5, 467.7, 471.49, 462.43,
          471.03,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 75,
        averageDuration: 22.296,
        averageColdStartDuration: 464.02,
      },
      {
        runtime: "lambda-perf-nodejs12x-256-arm64",
        displayName: "nodejs12.x",
        initDurations: [
          171.03, 171.65, 164.23, 169.16, 165.11, 160.52, 161.18, 169.85,
          166.39, 167.29,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 54,
        averageDuration: 3.108,
        averageColdStartDuration: 166.641,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-256-arm64",
        displayName: "rust (prov.al2)",
        initDurations: [
          12.05, 11.61, 13.46, 11.54, 11.83, 11.59, 11.55, 11.76, 11.47, 12.1,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 13,
        averageDuration: 0.997,
        averageColdStartDuration: 11.896,
      },
      {
        runtime: "lambda-perf-python37-128-x86_64",
        displayName: "python3.7",
        initDurations: [
          122.82, 114, 122.82, 137.17, 128.15, 112.58, 119.44, 114.73, 130.53,
          109.76,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.888,
        averageColdStartDuration: 121.2,
      },
      {
        runtime: "lambda-perf-nodejs18x-256-x86_64",
        displayName: "nodejs18.x",
        initDurations: [
          157.33, 135.66, 132.61, 178.88, 186.03, 171.66, 168.57, 164.39, 163.8,
          162.77,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 66,
        averageDuration: 4.062,
        averageColdStartDuration: 162.17,
      },
      {
        runtime: "lambda-perf-python310-256-x86_64",
        displayName: "python3.10",
        initDurations: [
          144.59, 105.68, 106.21, 109.52, 114.07, 122.22, 114.92, 114.54,
          108.51, 109.1,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.378,
        averageColdStartDuration: 114.936,
      },
      {
        runtime: "lambda-perf-ruby27-512-x86_64",
        displayName: "ruby2.7",
        initDurations: [
          132.92, 119.85, 132.4, 124.07, 130.06, 129.79, 143.71, 141.8, 133.1,
          136.32,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 30.2,
        averageDuration: 2.733,
        averageColdStartDuration: 132.402,
      },
      {
        runtime: "lambda-perf-nodejs16x-1024-x86_64",
        displayName: "nodejs16.x",
        initDurations: [
          158.06, 152.66, 151.12, 152.97, 158.26, 152.66, 156.79, 170.79,
          165.71, 151.97,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 57.9,
        averageDuration: 2.668,
        averageColdStartDuration: 157.099,
      },
      {
        runtime: "lambda-perf-quarkus_native_on_provided_al2-512-x86_64",
        displayName: "quarkus (prov.al2)",
        initDurations: [
          254.03, 236.49, 230.49, 201.15, 305.51, 242.55, 230.01, 190.01,
          229.63, 239.5,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 55.2,
        averageDuration: 49.126,
        averageColdStartDuration: 235.937,
      },
      {
        runtime: "lambda-perf-dotnet6-1024-x86_64",
        displayName: "dotnet6",
        initDurations: [
          229.72, 216.48, 293.04, 233.39, 215.37, 195.83, 232.84, 221.46,
          225.78, 222.87,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 59.7,
        averageDuration: 53.031,
        averageColdStartDuration: 228.678,
      },
      {
        runtime: "lambda-perf-nodejs16x-128-arm64",
        displayName: "nodejs16.x",
        initDurations: [
          165.92, 159.8, 164.06, 163.6, 162.68, 161.32, 161.14, 158.07, 157.91,
          157.28,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 55.9,
        averageDuration: 10.911,
        averageColdStartDuration: 161.178,
      },
      {
        runtime: "lambda-perf-python310-128-arm64",
        displayName: "python3.10",
        initDurations: [
          104.82, 109.5, 111.72, 124.45, 107.54, 113.89, 101.55, 116.1, 102.81,
          103.82,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 35,
        averageDuration: 1.297,
        averageColdStartDuration: 109.62,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-1024-x86_64",
        displayName: "rust (prov.al2)",
        initDurations: [
          14.7, 14.26, 14.76, 14.07, 15.08, 14.01, 14.16, 14.19, 15.51, 14.71,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 13.1,
        averageDuration: 1.071,
        averageColdStartDuration: 14.545,
      },
      {
        runtime: "lambda-perf-nodejs14x-256-arm64",
        displayName: "nodejs14.x",
        initDurations: [
          174.89, 179.78, 184.15, 178.45, 177.78, 186.9, 184.23, 179.22, 176.07,
          184.21,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 56,
        averageDuration: 3.114,
        averageColdStartDuration: 180.568,
      },
      {
        runtime: "lambda-perf-nodejs16x-128-x86_64",
        displayName: "nodejs16.x",
        initDurations: [
          153.03, 138.21, 152.37, 152.01, 140.61, 148.64, 164.64, 158.47,
          159.96, 151.1,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 57.5,
        averageDuration: 12.123,
        averageColdStartDuration: 151.904,
      },
      {
        runtime: "lambda-perf-dotnet6-128-arm64",
        displayName: "dotnet6",
        initDurations: [
          262.16, 266.33, 269.65, 256.77, 266.02, 265.94, 254.38, 270.8, 258.21,
          265.54,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 62.4,
        averageDuration: 740.809,
        averageColdStartDuration: 263.58,
      },
      {
        runtime: "lambda-perf-dotnetcore31-128-x86_64",
        displayName: "dotnetcore3.1",
        initDurations: [
          123.89, 157.41, 158.82, 157.94, 157.19, 123.25, 157.45, 127.95,
          155.28, 154.63,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 50,
        averageDuration: 224.199,
        averageColdStartDuration: 147.381,
      },
      {
        runtime: "lambda-perf-dotnetcore31-256-x86_64",
        displayName: "dotnetcore3.1",
        initDurations: [
          194.92, 153.03, 155.99, 158.08, 164.79, 165.9, 152.34, 154.78, 182.12,
          161.69,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 50.1,
        averageDuration: 92.047,
        averageColdStartDuration: 164.364,
      },
      {
        runtime: "lambda-perf-java8-1024-x86_64",
        displayName: "java8",
        initDurations: [
          508.94, 523.03, 431.46, 529.85, 510.67, 520.59, 564.33, 557.73,
          500.27, 501.67,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 76,
        averageDuration: 29.324,
        averageColdStartDuration: 514.854,
      },
      {
        runtime: "lambda-perf-dotnet7_aot_on_provided_al2-128-x86_64",
        displayName: "dotnet7 aot (prov.al2)",
        initDurations: [
          109.28, 93.45, 117.57, 109.7, 108.72, 116.08, 104.76, 122.01, 106.14,
          115.25,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 34,
        averageDuration: 32.79,
        averageColdStartDuration: 110.296,
      },
      {
        runtime: "lambda-perf-dotnetcore31-512-x86_64",
        displayName: "dotnetcore3.1",
        initDurations: [
          156.94, 266.79, 164.02, 155.01, 152.57, 153.74, 154.95, 164.07,
          156.11, 124.24,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 50,
        averageDuration: 35.832,
        averageColdStartDuration: 164.844,
      },
      {
        runtime: "lambda-perf-nodejs14x-128-arm64",
        displayName: "nodejs14.x",
        initDurations: [
          196.77, 182.55, 184.1, 177.08, 184.85, 182.9, 188.3, 177.72, 186.34,
          185.17,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 56,
        averageDuration: 12.938,
        averageColdStartDuration: 184.578,
      },
      {
        runtime: "lambda-perf-ruby27-1024-x86_64",
        displayName: "ruby2.7",
        initDurations: [
          137.94, 132.19, 147.54, 131.27, 140.76, 138.52, 164.34, 153.07,
          130.79, 132.1,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 30.2,
        averageDuration: 2.26,
        averageColdStartDuration: 140.852,
      },
      {
        runtime: "lambda-perf-nodejs16x-512-x86_64",
        displayName: "nodejs16.x",
        initDurations: [
          156.49, 155.01, 152.43, 149.59, 156.08, 148.95, 152.8, 147.44, 203.14,
          155.35,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 57.8,
        averageDuration: 2.561,
        averageColdStartDuration: 157.728,
      },
      {
        runtime: "lambda-perf-nodejs14x-1024-x86_64",
        displayName: "nodejs14.x",
        initDurations: [
          163.82, 163.67, 194.7, 170.32, 163.53, 182.48, 170.3, 169.72, 181.12,
          171.91,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 56.9,
        averageDuration: 4.136,
        averageColdStartDuration: 173.157,
      },
      {
        runtime: "lambda-perf-nodejs12x-256-x86_64",
        displayName: "nodejs12.x",
        initDurations: [
          153.75, 155.33, 147.91, 159.1, 153.13, 150.22, 160.32, 154.14, 118.62,
          167.81,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 55.1,
        averageDuration: 2.267,
        averageColdStartDuration: 152.033,
      },
      {
        runtime: "lambda-perf-dotnet6-128-x86_64",
        displayName: "dotnet6",
        initDurations: [
          311.27, 250.64, 198.43, 184.15, 217.18, 219.68, 220.69, 209.04,
          187.09, 166.61,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 59.9,
        averageDuration: 552.004,
        averageColdStartDuration: 216.478,
      },
      {
        runtime: "lambda-perf-python310-512-x86_64",
        displayName: "python3.10",
        initDurations: [
          107.21, 103.76, 109.36, 117.25, 115.39, 110.51, 108.14, 109.88,
          103.73, 106.43,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.352,
        averageColdStartDuration: 109.166,
      },
      {
        runtime: "lambda-perf-python310-1024-arm64",
        displayName: "python3.10",
        initDurations: [
          104.27, 105.98, 107.77, 108.11, 110.47, 107.15, 111.47, 108.34,
          109.56, 107.41,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 35,
        averageDuration: 1.29,
        averageColdStartDuration: 108.053,
      },
      {
        runtime: "lambda-perf-nodejs18x-128-x86_64",
        displayName: "nodejs18.x",
        initDurations: [
          164.2, 164, 166.8, 151.52, 151.58, 176.28, 163.12, 161.77, 170.06,
          176.05,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 66,
        averageDuration: 10.173,
        averageColdStartDuration: 164.538,
      },
      {
        runtime: "lambda-perf-python39-256-x86_64",
        displayName: "python3.9",
        initDurations: [
          103.32, 105.73, 109.08, 104.82, 125.61, 136.67, 106.36, 109.27,
          103.27, 103.92,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.561,
        averageColdStartDuration: 110.805,
      },
      {
        runtime: "lambda-perf-go1x-128-x86_64",
        displayName: "go1.x",
        initDurations: [
          88.73, 83.64, 82.01, 89.94, 96.78, 69.67, 85.24, 88.8, 84.59, 80.9,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 29.3,
        averageDuration: 6.379,
        averageColdStartDuration: 85.03,
      },
      {
        runtime: "lambda-perf-python310-512-arm64",
        displayName: "python3.10",
        initDurations: [
          106.75, 107.49, 107.64, 110.39, 109.18, 115.53, 109.04, 110.23,
          111.09, 113.7,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 35,
        averageDuration: 1.326,
        averageColdStartDuration: 110.104,
      },
      {
        runtime: "lambda-perf-dotnet6-256-arm64",
        displayName: "dotnet6",
        initDurations: [
          262.96, 261.59, 268.91, 262.6, 252.18, 253.32, 248.73, 261.45, 267.62,
          273.48,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 62.2,
        averageDuration: 357.846,
        averageColdStartDuration: 261.284,
      },
      {
        runtime: "lambda-perf-nodejs14x-1024-arm64",
        displayName: "nodejs14.x",
        initDurations: [
          182.54, 184, 183.29, 175.62, 177.95, 190.59, 184.22, 182.56, 178.13,
          177.46,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 56,
        averageDuration: 3.115,
        averageColdStartDuration: 181.636,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-1024-arm64",
        displayName: "rust (prov.al2)",
        initDurations: [
          12.27, 11.64, 11.71, 11.35, 12.38, 11.6, 11.36, 11.69, 11.94, 11.02,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 13,
        averageDuration: 0.979,
        averageColdStartDuration: 11.696,
      },
      {
        runtime: "lambda-perf-ruby27-128-arm64",
        displayName: "ruby2.7",
        initDurations: [
          146.59, 153.7, 152.98, 142.37, 146.65, 149.25, 151.89, 156.44, 149.42,
          142.86,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 30.1,
        averageDuration: 11.772,
        averageColdStartDuration: 149.215,
      },
      {
        runtime: "lambda-perf-go_on_provided-256-x86_64",
        displayName: "go (provided)",
        initDurations: [
          52.56, 52.82, 53.16, 54.43, 52.01, 50.24, 52.16, 52.79, 55.99, 53.88,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 19,
        averageDuration: 1.57,
        averageColdStartDuration: 53.004,
      },
      {
        runtime: "lambda-perf-graalvm_java17_on_provided_al2-256-x86_64",
        displayName: "graalvm java17 (prov.al2)",
        initDurations: [
          120.89, 126.4, 122.55, 124.59, 119.56, 122.83, 122.38, 143.29, 133.83,
          134.1,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 34,
        averageDuration: 27.948,
        averageColdStartDuration: 127.042,
      },
      {
        runtime: "lambda-perf-java11-512-arm64",
        displayName: "java11",
        initDurations: [
          453.52, 453.52, 463.64, 445.11, 460.8, 427.19, 451.91, 455.45, 445.34,
          446.3,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 71,
        averageDuration: 15.459,
        averageColdStartDuration: 450.278,
      },
      {
        runtime: "lambda-perf-nodejs18x-512-arm64",
        displayName: "nodejs18.x",
        initDurations: [
          172.93, 178.04, 176.05, 180.37, 176.84, 170.15, 185.6, 182.74, 177.8,
          172.43,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 65,
        averageDuration: 3.114,
        averageColdStartDuration: 177.295,
      },
      {
        runtime: "lambda-perf-python39-128-x86_64",
        displayName: "python3.9",
        initDurations: [
          106.32, 107.63, 114.95, 99.48, 104.8, 91.68, 102.33, 106.97, 105.41,
          109.42,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.829,
        averageColdStartDuration: 104.899,
      },
      {
        runtime: "lambda-perf-python38-512-x86_64",
        displayName: "python3.8",
        initDurations: [
          114.97, 127.19, 113.44, 98.38, 122.67, 133.28, 115.35, 119.99, 113.87,
          125.75,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 38.2,
        averageDuration: 1.358,
        averageColdStartDuration: 118.489,
      },
      {
        runtime: "lambda-perf-nodejs16x-512-arm64",
        displayName: "nodejs16.x",
        initDurations: [
          166.75, 165.92, 158.31, 161.33, 157.16, 156.38, 162.61, 160.06,
          161.45, 158.8,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 55.6,
        averageDuration: 2.931,
        averageColdStartDuration: 160.877,
      },
      {
        runtime: "lambda-perf-python37-1024-x86_64",
        displayName: "python3.7",
        initDurations: [
          123.96, 98.68, 123.26, 87.95, 113.57, 117.96, 116.81, 114.91, 108.17,
          111.76,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.778,
        averageColdStartDuration: 111.703,
      },
      {
        runtime: "lambda-perf-nodejs18x-512-x86_64",
        displayName: "nodejs18.x",
        initDurations: [
          186.25, 168.55, 165.47, 176.58, 181.74, 187.43, 210.17, 162.25,
          170.15, 176.6,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 66,
        averageDuration: 2.363,
        averageColdStartDuration: 178.519,
      },
      {
        runtime: "lambda-perf-ruby27-1024-arm64",
        displayName: "ruby2.7",
        initDurations: [
          147.99, 150.2, 146.99, 151.23, 149.82, 152.04, 147.76, 143.88, 149.58,
          148.26,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 30,
        averageDuration: 2.365,
        averageColdStartDuration: 148.775,
      },
      {
        runtime: "lambda-perf-python38-256-arm64",
        displayName: "python3.8",
        initDurations: [
          116.36, 119.44, 119.77, 118.66, 117.47, 122.36, 112.05, 117.03, 125.2,
          113.92,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 37.9,
        averageDuration: 1.397,
        averageColdStartDuration: 118.226,
      },
      {
        runtime: "lambda-perf-nodejs16x-256-arm64",
        displayName: "nodejs16.x",
        initDurations: [
          160.99, 156.16, 158.97, 161.71, 160.07, 159.62, 162.39, 156.59,
          157.99, 154.63,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 55.7,
        averageDuration: 2.864,
        averageColdStartDuration: 158.912,
      },
      {
        runtime: "lambda-perf-python38-1024-x86_64",
        displayName: "python3.8",
        initDurations: [
          122.57, 94.65, 91.06, 119.9, 95.42, 123.34, 93.05, 114.81, 115.53,
          129.29,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 38.1,
        averageDuration: 1.779,
        averageColdStartDuration: 109.962,
      },
      {
        runtime: "lambda-perf-java8-512-x86_64",
        displayName: "java8",
        initDurations: [
          511.19, 517.85, 552.18, 527.66, 491.84, 512.52, 500.49, 507.73, 541.1,
          505.87,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 73,
        averageDuration: 71.411,
        averageColdStartDuration: 516.843,
      },
      {
        runtime: "lambda-perf-nodejs16x-1024-arm64",
        displayName: "nodejs16.x",
        initDurations: [
          161.63, 164.44, 160.69, 162.02, 163.5, 164.2, 164.72, 156.31, 162.42,
          159.54,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 55.9,
        averageDuration: 2.936,
        averageColdStartDuration: 161.947,
      },
      {
        runtime: "lambda-perf-go1x-1024-x86_64",
        displayName: "go1.x",
        initDurations: [
          84.67, 87.41, 82.4, 84.29, 88.51, 83.05, 84.12, 83.35, 67.9, 83.61,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 29,
        averageDuration: 1.953,
        averageColdStartDuration: 82.931,
      },
      {
        runtime: "lambda-perf-python39-128-arm64",
        displayName: "python3.9",
        initDurations: [
          107.97, 109.7, 109.39, 105.61, 106.7, 105.94, 108.72, 107.55, 102.32,
          107.43,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 35,
        averageDuration: 1.376,
        averageColdStartDuration: 107.133,
      },
      {
        runtime: "lambda-perf-dotnet6-512-x86_64",
        displayName: "dotnet6",
        initDurations: [
          218.46, 277.5, 225.62, 217.71, 217.75, 223.58, 216.62, 219.88, 250.66,
          220.09,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 59.8,
        averageDuration: 119.422,
        averageColdStartDuration: 228.787,
      },
      {
        runtime: "lambda-perf-python39-512-arm64",
        displayName: "python3.9",
        initDurations: [
          105.35, 108.79, 107.62, 105.67, 104.36, 109.21, 107.79, 108.43,
          110.97, 102.3,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 35,
        averageDuration: 1.327,
        averageColdStartDuration: 107.049,
      },
      {
        runtime: "lambda-perf-ruby27-128-x86_64",
        displayName: "ruby2.7",
        initDurations: [
          153.64, 138.5, 144.39, 128.07, 153.42, 134.04, 104.86, 133.32, 132.12,
          130.23,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 30,
        averageDuration: 13.901,
        averageColdStartDuration: 135.259,
      },
      {
        runtime: "lambda-perf-python37-256-x86_64",
        displayName: "python3.7",
        initDurations: [
          145.79, 88.18, 118.96, 112.44, 108.09, 112.34, 114.73, 129.14, 109.5,
          168.15,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 2.094,
        averageColdStartDuration: 120.732,
      },
      {
        runtime: "lambda-perf-quarkus_native_on_provided_al2-128-x86_64",
        displayName: "quarkus (prov.al2)",
        initDurations: [
          237.08, 250.56, 261.79, 242.2, 234.39, 234.27, 245.39, 257.9, 280.14,
          228.28,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 55.2,
        averageDuration: 227.705,
        averageColdStartDuration: 247.2,
      },
      {
        runtime: "lambda-perf-python39-256-arm64",
        displayName: "python3.9",
        initDurations: [
          112.78, 102.63, 106.14, 105.22, 106.88, 106.68, 97.07, 111.07, 108.9,
          110.91,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 35,
        averageDuration: 1.327,
        averageColdStartDuration: 106.828,
      },
      {
        runtime: "lambda-perf-java11_snapstart-256-x86_64",
        displayName: "java11 snapstart",
        initDurations: [188.26, 208.45, 215.14, 181.64, 162.84, 150.91],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 69.167,
        averageDuration: 66.023,
        averageColdStartDuration: 184.54,
      },
      {
        runtime: "lambda-perf-python39-512-x86_64",
        displayName: "python3.9",
        initDurations: [
          107.36, 110.6, 109.89, 110.72, 99.24, 83.61, 104.01, 103.49, 103.72,
          102.64,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.24,
        averageColdStartDuration: 103.528,
      },
      {
        runtime: "lambda-perf-nodejs12x-128-x86_64",
        displayName: "nodejs12.x",
        initDurations: [
          149.62, 148.23, 178.5, 169.85, 163.81, 157.47, 249.39, 159.06, 156.35,
          160.49,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 55,
        averageDuration: 9.752,
        averageColdStartDuration: 169.277,
      },
      {
        runtime: "lambda-perf-nodejs12x-512-arm64",
        displayName: "nodejs12.x",
        initDurations: [
          168.13, 167.73, 166.4, 165.71, 168.41, 161.41, 162.96, 172.06, 166.56,
          163.77,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 54,
        averageDuration: 3.206,
        averageColdStartDuration: 166.314,
      },
      {
        runtime: "lambda-perf-dotnetcore31-256-arm64",
        displayName: "dotnetcore3.1",
        initDurations: [
          171.98, 179.48, 170.13, 182.27, 175.63, 172.26, 171.78, 162.17,
          176.27, 172.08,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 53.1,
        averageDuration: 125.954,
        averageColdStartDuration: 173.405,
      },
      {
        runtime: "lambda-perf-java8-256-x86_64",
        displayName: "java8",
        initDurations: [
          488.27, 561.75, 516.46, 530.52, 516.09, 513.91, 574.09, 500.95,
          437.55, 572.72,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 72.1,
        averageDuration: 173.278,
        averageColdStartDuration: 521.231,
      },
      {
        runtime: "lambda-perf-nodejs18x-256-arm64",
        displayName: "nodejs18.x",
        initDurations: [
          184.86, 173.23, 176.15, 175.38, 180.54, 174.32, 177.29, 169.51,
          173.02, 177.24,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 65,
        averageDuration: 3.021,
        averageColdStartDuration: 176.154,
      },
      {
        runtime: "lambda-perf-ruby27-256-arm64",
        displayName: "ruby2.7",
        initDurations: [
          144.13, 149.48, 157.9, 154.65, 146.4, 154.99, 140.65, 150.8, 145.86,
          147.64,
        ],
        memorySize: 256,
        architecture: "arm64",
        averageMemoryUsed: 30,
        averageDuration: 2.316,
        averageColdStartDuration: 149.25,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-512-x86_64",
        displayName: "rust (prov.al2)",
        initDurations: [
          14.79, 14.74, 14.58, 14.86, 25.95, 14.71, 15.01, 13.87, 13.85, 13.83,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 13.3,
        averageDuration: 1.065,
        averageColdStartDuration: 15.619,
      },
      {
        runtime: "lambda-perf-python38-128-arm64",
        displayName: "python3.8",
        initDurations: [
          117.66, 109.93, 119.91, 117.34, 108.39, 110.44, 116.41, 117.14,
          114.65, 121.1,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 38,
        averageDuration: 1.333,
        averageColdStartDuration: 115.297,
      },
      {
        runtime: "lambda-perf-dotnetcore31-1024-arm64",
        displayName: "dotnetcore3.1",
        initDurations: [
          184.95, 173.86, 174.36, 174.37, 176.66, 176.57, 169.71, 171.18, 180.7,
          168.63,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 53.1,
        averageDuration: 26.716,
        averageColdStartDuration: 175.099,
      },
      {
        runtime: "lambda-perf-python38-1024-arm64",
        displayName: "python3.8",
        initDurations: [
          116.6, 120.6, 117.81, 115.18, 117.31, 126.43, 117.82, 120.5, 113.65,
          122.39,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 38,
        averageDuration: 1.441,
        averageColdStartDuration: 118.829,
      },
      {
        runtime: "lambda-perf-python38-256-x86_64",
        displayName: "python3.8",
        initDurations: [
          95.09, 121.53, 119.57, 126.67, 115.11, 112.03, 119.32, 123.01, 120.97,
          115.68,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 38,
        averageDuration: 1.459,
        averageColdStartDuration: 116.898,
      },
      {
        runtime: "lambda-perf-nodejs12x-512-x86_64",
        displayName: "nodejs12.x",
        initDurations: [
          158.01, 127.78, 164.67, 149.99, 154.36, 159.67, 130.34, 146.63,
          172.23, 155.11,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 55,
        averageDuration: 2.379,
        averageColdStartDuration: 151.879,
      },
      {
        runtime: "lambda-perf-java11-256-x86_64",
        displayName: "java11",
        initDurations: [
          463.05, 481.05, 451.81, 437.58, 365.18, 467.68, 365.05, 463.69,
          447.97, 555.68,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 74.8,
        averageDuration: 43.338,
        averageColdStartDuration: 449.874,
      },
      {
        runtime: "lambda-perf-ruby27-256-x86_64",
        displayName: "ruby2.7",
        initDurations: [
          136.15, 144.94, 155.29, 110.92, 132.59, 134.55, 135.64, 144.33,
          131.16, 135.06,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 30.1,
        averageDuration: 2.156,
        averageColdStartDuration: 136.063,
      },
      {
        runtime: "lambda-perf-graalvm_java17_on_provided_al2-128-x86_64",
        displayName: "graalvm java17 (prov.al2)",
        initDurations: [
          124.85, 126.46, 101.77, 126.61, 162.76, 126.67, 138.85, 121.33,
          122.39, 119.91,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 34,
        averageDuration: 69.642,
        averageColdStartDuration: 127.16,
      },
      {
        runtime: "lambda-perf-python310-1024-x86_64",
        displayName: "python3.10",
        initDurations: [
          87.52, 113.48, 117.24, 90.56, 203.56, 106.93, 104.78, 111.36, 117.71,
          106.45,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 2.153,
        averageColdStartDuration: 115.959,
      },
      {
        runtime: "lambda-perf-nodejs12x-1024-x86_64",
        displayName: "nodejs12.x",
        initDurations: [
          159, 150.3, 156.09, 152.82, 144.79, 165.37, 156.87, 156.79, 163.71,
          156.13,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 55,
        averageDuration: 2.28,
        averageColdStartDuration: 156.187,
      },
      {
        runtime: "lambda-perf-nodejs18x-1024-x86_64",
        displayName: "nodejs18.x",
        initDurations: [
          161.61, 168.95, 167.71, 164.03, 163.86, 164.36, 166.3, 163.1, 190.22,
          165.51,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 66,
        averageDuration: 2.428,
        averageColdStartDuration: 167.565,
      },
      {
        runtime: "lambda-perf-quarkus_native_on_provided_al2-256-x86_64",
        displayName: "quarkus (prov.al2)",
        initDurations: [
          247.98, 239.27, 280.99, 253.34, 244.54, 226.82, 268.54, 241.99,
          229.65, 256.07,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 55.1,
        averageDuration: 108.429,
        averageColdStartDuration: 248.919,
      },
      {
        runtime: "lambda-perf-dotnetcore31-1024-x86_64",
        displayName: "dotnetcore3.1",
        initDurations: [
          153.93, 163.53, 145.28, 128.58, 158.83, 158.01, 124.04, 150.92,
          151.36, 160.33,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 50,
        averageDuration: 19.315,
        averageColdStartDuration: 149.481,
      },
      {
        runtime: "lambda-perf-java11_snapstart-1024-x86_64",
        displayName: "java11 snapstart",
        initDurations: [292.75, 218.06, 144.6, 271.39, 192.42, 279, 226.89],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 76.143,
        averageDuration: 22.51,
        averageColdStartDuration: 232.159,
      },
      {
        runtime: "lambda-perf-go1x-512-x86_64",
        displayName: "go1.x",
        initDurations: [
          84.18, 83.18, 82.53, 94.56, 83.91, 81.57, 88.38, 87.18, 86.12, 82.5,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 29.1,
        averageDuration: 1.959,
        averageColdStartDuration: 85.411,
      },
      {
        runtime: "lambda-perf-java11-1024-x86_64",
        displayName: "java11",
        initDurations: [
          476.06, 457.66, 448.25, 463.86, 469.53, 459.35, 452.99, 442.6, 448.88,
          357.34,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 77,
        averageDuration: 9.17,
        averageColdStartDuration: 447.652,
      },
      {
        runtime: "lambda-perf-dotnet6-1024-arm64",
        displayName: "dotnet6",
        initDurations: [
          273.99, 263.71, 270.01, 259.57, 254.94, 251.68, 269.28, 273.96,
          252.58, 253.56,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 63,
        averageDuration: 72.527,
        averageColdStartDuration: 262.328,
      },
      {
        runtime: "lambda-perf-java11_snapstart-128-x86_64",
        displayName: "java11 snapstart",
        initDurations: [
          289.45, 244.4, 219.81, 243.22, 280.22, 310.1, 255.39, 258.85, 216.53,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 70,
        averageDuration: 142.573,
        averageColdStartDuration: 257.552,
      },
      {
        runtime: "lambda-perf-java11-128-arm64",
        displayName: "java11",
        initDurations: [
          445.51, 416.04, 444.12, 426.91, 439.75, 447.11, 471.12, 463.59,
          440.65, 448.37,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 70,
        averageDuration: 96.391,
        averageColdStartDuration: 444.317,
      },
      {
        runtime: "lambda-perf-python39-1024-x86_64",
        displayName: "python3.9",
        initDurations: [
          104.73, 107.02, 112.02, 102.25, 103.06, 143.02, 115.64, 136.61,
          103.79, 136.57,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 36,
        averageDuration: 1.409,
        averageColdStartDuration: 116.471,
      },
      {
        runtime: "lambda-perf-dotnetcore31-512-arm64",
        displayName: "dotnetcore3.1",
        initDurations: [
          170.67, 173.98, 183.78, 171.04, 159.91, 176.97, 176.29, 172.86,
          174.52, 165.97,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 53.1,
        averageDuration: 54.649,
        averageColdStartDuration: 172.599,
      },
      {
        runtime: "lambda-perf-go_on_provided-512-x86_64",
        displayName: "go (provided)",
        initDurations: [
          52.07, 44.88, 43.13, 52.57, 52.73, 50.97, 51.84, 77.93, 50.4, 51.78,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 19,
        averageDuration: 2.764,
        averageColdStartDuration: 52.83,
      },
      {
        runtime: "lambda-perf-java11-128-x86_64",
        displayName: "java11",
        initDurations: [
          493.8, 448.91, 456.18, 499.91, 350.44, 456.81, 463.89, 449.35, 469.1,
          459.23,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 74.8,
        averageDuration: 124.131,
        averageColdStartDuration: 454.762,
      },
      {
        runtime: "lambda-perf-dotnet7_aot_on_provided_al2-256-x86_64",
        displayName: "dotnet7 aot (prov.al2)",
        initDurations: [
          118.34, 109.9, 114.21, 110.67, 106.09, 106.14, 121.53, 108.02, 108.19,
          110.68,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 34,
        averageDuration: 13.392,
        averageColdStartDuration: 111.377,
      },
      {
        runtime: "lambda-perf-nodejs18x-128-arm64",
        displayName: "nodejs18.x",
        initDurations: [
          174.27, 169.76, 172.25, 203.97, 178.1, 177.92, 166.85, 182.37, 178.86,
          177.99,
        ],
        memorySize: 128,
        architecture: "arm64",
        averageMemoryUsed: 65,
        averageDuration: 11.751,
        averageColdStartDuration: 178.234,
      },
      {
        runtime: "lambda-perf-dotnet7_aot_on_provided_al2-512-x86_64",
        displayName: "dotnet7 aot (prov.al2)",
        initDurations: [
          107.05, 108.23, 91.48, 105.62, 112.08, 104.72, 119.93, 111.56, 116.35,
          115.41,
        ],
        memorySize: 512,
        architecture: "x86_64",
        averageMemoryUsed: 34.1,
        averageDuration: 6.458,
        averageColdStartDuration: 109.243,
      },
      {
        runtime: "lambda-perf-python38-512-arm64",
        displayName: "python3.8",
        initDurations: [
          116.45, 114.55, 117.46, 110.73, 116.67, 119.64, 116.47, 117.24,
          119.56, 116.65,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 38,
        averageDuration: 1.372,
        averageColdStartDuration: 116.542,
      },
      {
        runtime: "lambda-perf-java8-128-x86_64",
        displayName: "java8",
        initDurations: [
          557, 515.33, 511.81, 521.49, 496.02, 520.4, 528.43, 631.97, 501.05,
          520.08,
        ],
        memorySize: 128,
        architecture: "x86_64",
        averageMemoryUsed: 72.1,
        averageDuration: 367.172,
        averageColdStartDuration: 530.358,
      },
      {
        runtime: "lambda-perf-graalvm_java17_on_provided_al2-1024-x86_64",
        displayName: "graalvm java17 (prov.al2)",
        initDurations: [
          126.18, 161.68, 124.76, 119.72, 122.33, 122.58, 120.54, 122.61,
          120.15, 134.86,
        ],
        memorySize: 1024,
        architecture: "x86_64",
        averageMemoryUsed: 34,
        averageDuration: 7.517,
        averageColdStartDuration: 127.541,
      },
      {
        runtime: "lambda-perf-python39-1024-arm64",
        displayName: "python3.9",
        initDurations: [
          106.25, 106.18, 102.87, 110.1, 106.95, 111.31, 107.7, 110.47, 113.46,
          102.96,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 35.1,
        averageDuration: 1.381,
        averageColdStartDuration: 107.825,
      },
      {
        runtime: "lambda-perf-go1x-256-x86_64",
        displayName: "go1.x",
        initDurations: [
          76.26, 83.43, 85.37, 82.98, 83.56, 68.93, 81.92, 88.7, 88.17, 85,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 29.1,
        averageDuration: 1.984,
        averageColdStartDuration: 82.432,
      },
      {
        runtime: "lambda-perf-nodejs18x-1024-arm64",
        displayName: "nodejs18.x",
        initDurations: [
          176.29, 179.87, 178.16, 174.26, 173.37, 175.33, 174.16, 177.14,
          176.56, 172.53,
        ],
        memorySize: 1024,
        architecture: "arm64",
        averageMemoryUsed: 65,
        averageDuration: 3.194,
        averageColdStartDuration: 175.767,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-256-x86_64",
        displayName: "rust (prov.al2)",
        initDurations: [
          14.15, 18.92, 14.83, 17.4, 18.51, 15.47, 14.03, 14.24, 15.06, 14.48,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 13.2,
        averageDuration: 1.074,
        averageColdStartDuration: 15.709,
      },
      {
        runtime: "lambda-perf-rust_on_provided_al2-512-arm64",
        displayName: "rust (prov.al2)",
        initDurations: [
          12.04, 11.43, 12.22, 11.11, 13.38, 11.91, 11.45, 11.63, 11.84, 12.33,
        ],
        memorySize: 512,
        architecture: "arm64",
        averageMemoryUsed: 13,
        averageDuration: 0.985,
        averageColdStartDuration: 11.934,
      },
      {
        runtime: "lambda-perf-dotnet6-256-x86_64",
        displayName: "dotnet6",
        initDurations: [
          225.52, 227.31, 190.29, 224.16, 248.53, 247.95, 183.18, 249.27,
          229.37, 220.73,
        ],
        memorySize: 256,
        architecture: "x86_64",
        averageMemoryUsed: 59.9,
        averageDuration: 269.139,
        averageColdStartDuration: 224.631,
      },
    ],
  };

  dataManager.fetchData = json;
};

const animate = async (dataManager) => {
  try {
    const memorySize = getCurrentMemorySize();
    const architecture = getCurrentArchitecture();
    console.log(memorySize);
    console.log(architecture);
    if (!dataManager.fetchData) {
      await load(dataManager);
    }
    const data = dataManager.fetchData;
    console.log(data);
    document.getElementById("lastUpdate").innerHTML = data.metadata.generatedAt;
    const promiseArray = [];
    let i = 0;
    data.runtimeData.sort(
      (a, b) => a.averageColdStartDuration - b.averageColdStartDuration
    );
    for (runtime of data.runtimeData.filter(
      (r) => r.memorySize == memorySize && r.architecture === architecture
    )) {
      promiseArray.push(drawLang(i, runtime));
      ++i;
    }
    // todo remove after backward compatibility
    if (promiseArray.length === 0) {
      for (runtime of data.runtimeData) {
        promiseArray.push(drawLang(i, runtime));
        ++i;
      }
    }
    await Promise.all(promiseArray);
  } catch (e) {
    console.error(e);
  }
};

const updateFilter = async (e, className, dataManager) => {
  const newValue = e.target.id;
  const btns = document.querySelectorAll(className);
  btns.forEach((el) => el.classList.remove("bg-success"));
  document.getElementById(newValue).classList.add("bg-success");
  await replayAnimation(dataManager);
};

const getCurrentMemorySize = () => {
  const buttons = document.getElementsByClassName("memorySizeBtn");
  for (btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return 128;
};

const getCurrentArchitecture = () => {
  const buttons = document.getElementsByClassName("architectureBtn");
  for (btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return "x86_64";
};

const replayAnimation = async (dataManager) => {
  document.getElementById("runtimes").innerHTML = "";
  await animate(dataManager);
};

const setupFilterEvent = (className, dataManager) => {
  const btnMemorySize = document.querySelectorAll(className);
  btnMemorySize.forEach((el) =>
    el.addEventListener("click", (e) => updateFilter(e, className, dataManager))
  );
};
const loaded = async (dataManager) => {
  setupFilterEvent(".memorySizeBtn", dataManager);
  setupFilterEvent(".architectureBtn", dataManager);
  document
    .getElementById("replayAnimationBtn")
    .addEventListener("click", (dataManager) => replayAnimation(dataManager));
  await animate(dataManager);
};

const drawLang = async (idx, data) => {
  const newElement = document
    .getElementById("sampleRuntimeElement")
    .cloneNode(true);
  newElement.id = `runtime_${idx}`;
  document.getElementById("runtimes").appendChild(newElement);
  const coldStartElement = newElement.getElementsByClassName("coldstarts")[0];

  const averageColdStartDuration = newElement.getElementsByClassName(
    "averageColdStartDuration"
  )[0];
  averageColdStartDuration.innerHTML = `${formatData(
    runtime.averageColdStartDuration
  )}ms`;

  const averageMemoryUsed =
    newElement.getElementsByClassName("averageMemoryUsed")[0];
  averageMemoryUsed.innerHTML = `${runtime.averageMemoryUsed}MB`;

  const averageDuration =
    newElement.getElementsByClassName("averageDuration")[0];
  averageDuration.innerHTML = `${formatData(runtime.averageDuration)}ms`;

  const runtimeName = newElement.getElementsByClassName("runtimeName")[0];
  runtimeName.innerHTML = `${runtime.displayName}`;

  for (let i = 0; i < data.initDurations.length; ++i) {
    await sleep(data.initDurations[i]);
    addSquare(coldStartElement);
  }
};

const addSquare = (parent) => {
  const span = document.createElement("span");
  span.classList.add("square");
  parent.appendChild(span);
};

const formatData = (data) =>
  typeof data === "number" ? data.toFixed(2) : data;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

document.addEventListener(
  "DOMContentLoaded",
  (dataManager) => loaded(dataManager),
  false
);
