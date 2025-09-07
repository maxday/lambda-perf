ARG ARCH
FROM public.ecr.aws/sam/build-dotnet7:latest-$ARCH AS builder
ARG ARCH
RUN dotnet tool install -g Amazon.Lambda.Tools
WORKDIR /tmp
COPY src .
RUN export PATH="$PATH:/root/.dotnet/tools" && dotnet lambda package -farch ${ARCH} --output-package /tmp/code.zip

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]