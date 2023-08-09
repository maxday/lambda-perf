ARG ARCH
FROM public.ecr.aws/sam/build-dotnet7:latest-$ARCH as builder
ARG ARCH
WORKDIR /tmp
COPY src .
#RUN dotnet tool install -g Amazon.Lambda.Tools

RUN export PATH="$PATH:/root/.dotnet/tools" && dotnet lambda package -farch ${ARCH} --output-package /tmp/code.zip

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]