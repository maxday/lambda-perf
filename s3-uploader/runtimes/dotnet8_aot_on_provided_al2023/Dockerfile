ARG ARCH
ARG TAG_SUFFIX

FROM plantpowerjames/dotnet-8-lambda-build:8.0.100${TAG_SUFFIX} as builder
WORKDIR /tmp
COPY src .
RUN if [ "$ARCH" = "arm64" ]; then RID="linux-arm64"; else RID="linux-x64"; fi \
 && dotnet publish -r ${RID} --output /tmp/code

RUN zip -j /tmp/code.zip /tmp/code/*

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]