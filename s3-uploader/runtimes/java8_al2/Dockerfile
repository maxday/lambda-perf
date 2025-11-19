FROM public.ecr.aws/sam/build-java8.al2 AS builder
WORKDIR /tmpBuild

COPY src ./src
COPY build.gradle .

RUN gradle :buildZip

FROM scratch
COPY --from=builder /tmpBuild/build/distributions/code.zip /
ENTRYPOINT ["/code.zip"]