FROM mcr.microsoft.com/dotnet/sdk:8.0 as builder
ARG ARCH
RUN apt-get update
RUN apt-get install -y zip
RUN dotnet tool install -g Amazon.Lambda.Tools
WORKDIR /tmp
COPY src .
RUN export PATH="$PATH:/root/.dotnet/tools" && dotnet lambda package -farch ${ARCH} --configuration Release --framework net8.0 --output-package /tmp/code.zip

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]