FROM public.ecr.aws/lambda/provided:al2 as builder
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
RUN /root/.cargo/bin/cargo build --release

RUN mv target/release/lambda-perf target/release/bootstrap
RUN zip -j /tmp/code.zip target/release/bootstrap

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]