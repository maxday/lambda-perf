FROM amazonlinux:2 AS builder
ENV APP_BASE_DIR=/tmp
WORKDIR $APP_BASE_DIR
RUN amazon-linux-extras install epel -y
RUN yum install sbcl zip -y
COPY lambda lambda
WORKDIR $APP_BASE_DIR/lambda
RUN sbcl --non-interactive --load lambda.lisp --eval '(sb-ext:save-lisp-and-die "lambda" :toplevel (function main) :executable t)'
RUN rm -f lambda.lisp
RUN zip -r $APP_BASE_DIR/code.zip .

FROM scratch
COPY --from=builder /tmp/code.zip /code.zip
ENTRYPOINT ["/code.zip"]