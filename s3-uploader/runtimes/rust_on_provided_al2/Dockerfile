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
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/lib.rs
RUN /root/.cargo/bin/cargo build --release
RUN rm -rf ./src
COPY src ./src
RUN touch -a -m ./src/lib.rs
RUN pip3 install cargo-lambda
RUN /root/.cargo/bin/cargo lambda build --release --${ARCH}
RUN zip -j /tmp/code.zip target/lambda/lambda-perf/bootstrap

FROM scratch
COPY --from=builder /tmp/code.zip /
ENTRYPOINT ["/code.zip"]