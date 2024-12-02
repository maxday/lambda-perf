FROM amazonlinux:2 AS builder
ENV APP_BASE_DIR=/tmp
WORKDIR $APP_BASE_DIR
RUN yum install binutils zip -y
COPY lambda lambda
WORKDIR $APP_BASE_DIR/lambda
RUN as -o lambda_$(uname -m).o lambda_$(uname -m).s && ld -o lambda lambda_$(uname -m).o
RUN rm -f lambda_*
RUN zip -r $APP_BASE_DIR/code.zip .

FROM scratch
COPY --from=builder /tmp/code.zip /code.zip
ENTRYPOINT ["/code.zip"]