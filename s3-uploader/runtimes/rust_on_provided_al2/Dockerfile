FROM public.ecr.aws/lambda/provided:al2 as builder
ARG ARCH
WORKDIR /usr/src/app
RUN yum -y update
RUN yum -y install openssl openssl-devel
RUN yum -y install gcc
RUN yum -y install zip
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN source $HOME/.cargo/env
COPY Cargo.toml .
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/lib.rs
RUN /root/.cargo/bin/cargo build --release
RUN rm -rf ./src
COPY src ./src
RUN touch -a -m ./src/lib.rs
RUN /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
RUN brew tap cargo-lambda/cargo-lambda
RUN brew install cargo-lambda
RUN /root/.cargo/bin/cargo lambda build --release --${ARCH}
RUN zip -j /tmp/code.zip target/lambda/lambda-perf/bootstrap

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]