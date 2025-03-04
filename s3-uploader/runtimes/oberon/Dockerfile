FROM amazonlinux:2 AS builder
ARG OBNC_VER=0.16.1
ENV APP_BASE_DIR=/tmp
WORKDIR $APP_BASE_DIR
RUN yum install gc-devel gcc tar gzip SDL-devel zip -y
RUN curl -o obnc.tgz "https://miasap.se/obnc/downloads/obnc_${OBNC_VER}.tar.gz"
RUN mkdir obnc && tar -xvvzf obnc.tgz --strip-components 1 -C obnc && rm -f obnc.tgz
WORKDIR "${APP_BASE_DIR}/obnc"
RUN ./build && ./install
WORKDIR $APP_BASE_DIR
RUN rm -rf obnc
COPY lambda lambda
WORKDIR $APP_BASE_DIR/lambda
RUN mkdir lib && cp /usr/lib64/libgc.so.1 lib && cp /usr/lib64/libatomic_ops.so.1 lib
RUN obnc MaxdayLambda.Mod 
RUN rm -f MaxdayLambda.Mod && rm -rf .obnc
### Only for debug
#ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$APP_BASE_DIR/lambda/lib 
RUN zip -r $APP_BASE_DIR/code.zip .

FROM scratch
COPY --from=builder /tmp/code.zip /code.zip
ENTRYPOINT ["/code.zip"]