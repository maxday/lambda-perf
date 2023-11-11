FROM public.ecr.aws/lambda/provided:al2 AS builder
ENV APP_BASE_DIR=/tmp/app
WORKDIR $APP_BASE_DIR
RUN yum install cmake3 git zip autoconf automake -y
RUN yum groupinstall "Development Tools" -y

COPY . $APP_BASE_DIR
WORKDIR $APP_BASE_DIR
SHELL ["/bin/bash", "-c"]
# Build static libcurl from source
RUN curl -O https://curl.se/download/curl-7.88.1.tar.gz
RUN tar -xvf curl-7.88.1.tar.gz
WORKDIR "${APP_BASE_DIR}/curl-7.88.1"
RUN autoreconf -fi
RUN ./configure --disable-shared --disable-pthreads --disable-threaded-resolver \
--with-pic --without-ssl --without-zlib
RUN make -j && make install
# Build the C++ Lambda runtime
WORKDIR "${APP_BASE_DIR}"
RUN git clone https://github.com/awslabs/aws-lambda-cpp.git
WORKDIR "${APP_BASE_DIR}/aws-lambda-cpp/"
RUN mkdir build
WORKDIR "${APP_BASE_DIR}/aws-lambda-cpp/build"
RUN cmake3 .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=~/lambda-install
RUN make && make install
# Build the Lambda function
WORKDIR "${APP_BASE_DIR}/lambda/"
RUN mkdir build
WORKDIR "${APP_BASE_DIR}/lambda/build"
RUN cmake3 .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=~/lambda-install
RUN make && make aws-lambda-package-maxdaylambda

FROM scratch
COPY --from=builder /tmp/app/lambda/build/maxdaylambda.zip /code.zip
ENTRYPOINT ["/code.zip"]
