FROM public.ecr.aws/lambda/provided:al2 AS builder
ARG ARCH

RUN yum update -y
RUN yum install gzip zip tar -y

RUN curl -LO https://go.dev/dl/go1.21.4.linux-${ARCH}.tar.gz
RUN tar -C /usr/local -xzf go1.21.4.linux-${ARCH}.tar.gz
ENV PATH=$PATH:/usr/local/go/bin

WORKDIR /tmpBuild

COPY main.go .
COPY go.mod .
COPY go.sum .
RUN GOARCH=${ARCH} go build -ldflags="-w -s" -tags lambda.norpc -o /tmp/bootstrap
RUN zip -j /tmp/code.zip /tmp/bootstrap

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]