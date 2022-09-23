FROM mcr.microsoft.com/dotnet/core/sdk:3.1 as builder
RUN apt-get update
RUN apt-get install -y zip
RUN dotnet tool install -g Amazon.Lambda.Tools
WORKDIR /tmp
COPY src .
RUN export PATH="$PATH:/root/.dotnet/tools" && dotnet lambda package --configuration Release --framework netcoreapp3.1 --output-package /tmp/code.zip

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]