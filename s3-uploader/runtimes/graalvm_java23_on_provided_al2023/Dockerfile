FROM quay.io/quarkus/ubi-quarkus-mandrel-builder-image:24.1.1.0-Final-java23 AS builder
RUN curl https://dlcdn.apache.org/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz --output apache-maven-3.9.9-bin.tar.gz
RUN tar xzf apache-maven-3.9.9-bin.tar.gz
COPY src ./src
COPY pom.xml .
RUN ./apache-maven-3.9.9/bin/mvn package -Pnative

# strip the binary
FROM ubuntu AS stripper
RUN apt-get update -y
RUN apt-get install -y binutils
COPY --from=builder /project/target/graalvm-java23 /tmp
RUN strip /tmp/graalvm-java23

# zip the extension
FROM ubuntu:latest AS compresser
RUN apt-get update
RUN apt-get install -y zip
RUN mkdir /package
WORKDIR /package
COPY --from=stripper /tmp/graalvm-java23 /package/bootstrap
RUN zip -j code.zip /package/bootstrap

FROM scratch
COPY --from=compresser /package/code.zip /
ENTRYPOINT ["/code.zip"]