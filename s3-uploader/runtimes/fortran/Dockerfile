FROM amazonlinux:2 AS builder
ENV APP_BASE_DIR=/tmp
WORKDIR $APP_BASE_DIR
RUN yum install gcc-gfortran zip -y
COPY lambda lambda
WORKDIR $APP_BASE_DIR/lambda
RUN gfortran lambda.f90 -o lambda
RUN rm -f lambda.f90
RUN mkdir lib && cp /usr/lib64/libgfortran.so.4 lib
### Only for debug
#ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$APP_BASE_DIR/lambda/lib
RUN zip -r $APP_BASE_DIR/code.zip .

FROM scratch
COPY --from=builder /tmp/code.zip /code.zip
ENTRYPOINT ["/code.zip"]