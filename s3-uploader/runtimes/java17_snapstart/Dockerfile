FROM public.ecr.aws/lambda/java:17 AS builder
WORKDIR /tmpBuild
RUN yum install -y unzip
RUN  curl -k -L -v -X GET https://services.gradle.org/distributions/gradle-8.3-bin.zip > gradle-8.3-bin.zip
RUN unzip -d /opt/gradle gradle-8.3-bin.zip

COPY src ./src
COPY build.gradle .

RUN JAVA_HOME=/var/lang /opt/gradle/gradle-8.3/bin/gradle :buildZip

FROM scratch
COPY --from=builder /tmpBuild/build/distributions/code.zip /
ENTRYPOINT ["/code.zip"]