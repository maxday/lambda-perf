FROM amazonlinux:2 AS builder
ARG FPC_VER=3.2.2
ENV APP_BASE_DIR=/tmp
WORKDIR $APP_BASE_DIR
RUN yum install tar gzip zip binutils expect -y
RUN curl -o fpc.tar "https://altushost-swe.dl.sourceforge.net/project/freepascal/Linux/${FPC_VER}/fpc-${FPC_VER}.$(uname -m)-linux.tar"
RUN mkdir fpc && tar -xvvf fpc.tar --strip-components 1 -C fpc && rm -f fpc.tar
WORKDIR "${APP_BASE_DIR}/fpc"
COPY unattended.exp .
RUN ./unattended.exp
WORKDIR $APP_BASE_DIR
RUN rm -rf fpc
COPY lambda lambda
WORKDIR $APP_BASE_DIR/lambda
RUN fpc lambda.pas
RUN rm -f lambda.*
RUN zip -r $APP_BASE_DIR/code.zip .

FROM scratch
COPY --from=builder /tmp/code.zip /code.zip
ENTRYPOINT ["/code.zip"]