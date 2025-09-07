FROM quay.io/quarkus/ubi-quarkus-mandrel-builder-image:23.0.1.2-Final-java17 AS builder
RUN curl https://dlcdn.apache.org/maven/maven-3/3.9.11/binaries/apache-maven-3.9.11-bin.tar.gz --output apache-maven-3.9.11-bin.tar.gz
RUN tar xzf apache-maven-3.9.11-bin.tar.gz
COPY src ./src
COPY pom.xml .
RUN ./apache-maven-3.9.11/bin/mvn package -Pnative

# strip the binary
FROM ubuntu as stripper
RUN apt-get update -y
RUN apt-get install -y binutils
COPY --from=builder /project/target/lambda-1.0-SNAPSHOT-runner /tmp
RUN strip /tmp/lambda-1.0-SNAPSHOT-runner

# zip the extension
FROM ubuntu:latest as compresser
RUN apt-get update
RUN apt-get install -y zip
RUN mkdir /package
WORKDIR /package
COPY --from=stripper /tmp/lambda-1.0-SNAPSHOT-runner /package/bootstrap
RUN zip -j code.zip /package/bootstrap

FROM scratch
COPY --from=compresser /package/code.zip /
ENTRYPOINT ["/code.zip"]