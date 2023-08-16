ARG ARCH
FROM --platform=$ARCH redhat/ubi9-minimal AS builder
ENV APP_BASE_DIR=/tmp/app
COPY . $APP_BASE_DIR
WORKDIR $APP_BASE_DIR
RUN microdnf install cmake make g++ git zip libcurl-devel zlib-devel -y
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
RUN cmake .. -DCMAKE_BUILD_TYPE=Debug -DCMAKE_INSTALL_PREFIX=~/lambda-install
RUN make && make aws-lambda-package-maxdaylambda


FROM scratch
COPY --from=builder /tmp/app/lambda/build/maxdaylambda.zip /code.zip
ENTRYPOINT ["/code.zip"]