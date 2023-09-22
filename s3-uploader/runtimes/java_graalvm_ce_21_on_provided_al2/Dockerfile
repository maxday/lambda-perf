FROM amazonlinux:2 as builder
RUN yum install zip unzip -y
RUN curl -s "https://get.sdkman.io" | bash
RUN /bin/bash -c "source /root/.sdkman/bin/sdkman-init.sh; sdk install maven;"
# ENTRYPOINT [ "/bin/bash" ]
RUN yum groupinstall "Development Tools" -y
RUN /bin/bash -c "source /root/.sdkman/bin/sdkman-init.sh;sdk install java 21-graalce;"
WORKDIR /lambda
COPY pom.xml .
ADD src ./src
RUN /bin/bash -c "source /root/.sdkman/bin/sdkman-init.sh;sdk default java 21-graalce;mvn clean package -Pnative -DskipTests"
# RUN ["/root/.sdkman/candidates/maven/current/bin/mvn", "clean", "package", "-Pnative", "-DskipTests"]
RUN mv target/LambdaNative bootstrap
RUN zip bootstrap.zip bootstrap

FROM scratch
COPY --from=builder /lambda/bootstrap.zip /
ENTRYPOINT ["/bootstrap.zip"]
