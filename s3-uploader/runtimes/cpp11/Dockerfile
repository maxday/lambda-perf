FROM public.ecr.aws/lambda/provided:al2 as builder
ENV APP_BASE_DIR=/tmp/app
WORKDIR $APP_BASE_DIR
RUN yum install cmake make g++ git zip libcurl-devel zlib-devel openssl-devel -y
# update cmake to 3.x
RUN yum groupinstall "Development Tools" -y
RUN curl -LO https://cmake.org/files/v3.27/cmake-3.27.0.tar.gz
RUN tar -xvzf cmake-3.27.0.tar.gz
WORKDIR "${APP_BASE_DIR}/cmake-3.27.0"
RUN ./bootstrap
RUN make
RUN make install

COPY . $APP_BASE_DIR
WORKDIR $APP_BASE_DIR
SHELL ["/bin/bash", "-c"]
RUN git clone https://github.com/awslabs/aws-lambda-cpp.git
WORKDIR "${APP_BASE_DIR}/aws-lambda-cpp/"
RUN mkdir build
WORKDIR "${APP_BASE_DIR}/aws-lambda-cpp/build"
RUN cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=~/lambda-install
RUN make && make install
WORKDIR "${APP_BASE_DIR}/lambda/"
RUN mkdir build
WORKDIR "${APP_BASE_DIR}/lambda/build"
RUN cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=~/lambda-install
RUN make && make aws-lambda-package-maxdaylambda

FROM scratch
COPY --from=builder /tmp/app/lambda/build/maxdaylambda.zip /code.zip
ENTRYPOINT ["/code.zip"]