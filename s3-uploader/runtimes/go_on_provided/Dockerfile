FROM golang:1.19.0 as builder
RUN apt-get update
RUN apt-get install -y zip
WORKDIR /tmpBuild

COPY main.go .
COPY go.mod .
COPY go.sum .
RUN go build -ldflags="-w -s" -tags lambda.norpc -o /tmp/bootstrap
RUN zip -j /tmp/code.zip /tmp/bootstrap

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]
