FROM oven/bun AS builder
RUN apt-get update
RUN apt-get install curl zip -y
RUN curl https://raw.githubusercontent.com/oven-sh/bun/main/packages/bun-lambda/runtime.ts --output runtime.ts
RUN bun install aws4fetch
RUN bun build --compile runtime.ts --outfile bootstrap

ADD index.js .
RUN zip -j /tmp/code.zip bootstrap index.js

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]