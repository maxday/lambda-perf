FROM amazonlinux:2 AS builder
ENV APP_BASE_DIR=/tmp
WORKDIR $APP_BASE_DIR
RUN yum install gcc-gnat zip -y
COPY lambda lambda
WORKDIR $APP_BASE_DIR/lambda
RUN gnatmake MaxdayLambda.ada
RUN rm -f MaxdayLambda.*
RUN zip -r $APP_BASE_DIR/code.zip .

FROM scratch
COPY --from=builder /tmp/code.zip /code.zip
ENTRYPOINT ["/code.zip"]