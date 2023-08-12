ARG ARCH
FROM --platform=$ARCH swift:5.8-amazonlinux2 AS builder
COPY . /tmp/app/src/
WORKDIR /tmp/app/src/
RUN yum install zip -y
RUN swift package archive --output-path /tmp/app/ --verbose 2 --disable-sandbox -static-stdlib

FROM scratch
COPY --from=builder /tmp/app/MaxdayLambda/MaxdayLambda.zip /code.zip
ENTRYPOINT ["/code.zip"]
