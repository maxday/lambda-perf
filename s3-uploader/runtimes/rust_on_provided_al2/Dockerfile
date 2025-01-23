FROM public.ecr.aws/lambda/provided:al2 as builder
ARG ARCH
WORKDIR /usr/src/app
RUN yum -y install openssl openssl-devel
RUN yum -y install gcc
RUN yum -y install zip
RUN yum -y install python3-pip
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN source $HOME/.cargo/env
COPY Cargo.toml .
COPY src ./src
RUN /root/.cargo/bin/cargo build --release
RUN mv target/release/lambda-perf target/release/bootstrap
RUN zip -j /tmp/code.zip target/release/bootstrap

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]