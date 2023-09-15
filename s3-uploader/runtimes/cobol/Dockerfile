FROM amazonlinux:2 AS builder
ARG GNUCOBOL_VER=3.2
ENV APP_BASE_DIR=/tmp
WORKDIR $APP_BASE_DIR
RUN yum install tar gzip make gcc gmp-devel zip -y
RUN curl -o gnucobol.tgz "https://nav.dl.sourceforge.net/project/gnucobol/gnucobol/${GNUCOBOL_VER}/gnucobol-${GNUCOBOL_VER}.tar.gz"
RUN mkdir gnucobol && tar -xvvzf gnucobol.tgz --strip-components 1 -C gnucobol && rm -f gnucobol.tgz
WORKDIR "${APP_BASE_DIR}/gnucobol"
RUN ./configure --without-db
RUN make && make install
WORKDIR $APP_BASE_DIR
RUN rm -rf gnucobol
COPY lambda lambda
WORKDIR $APP_BASE_DIR/lambda
RUN mkdir lib && cp /usr/local/lib/libcob.so.4 lib
RUN cobc -x lambda.cob
RUN rm -f lambda.cob
### Only for debug
#ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$APP_BASE_DIR/lambda/lib 
RUN zip -r $APP_BASE_DIR/code.zip .

FROM scratch
COPY --from=builder /tmp/code.zip /code.zip
ENTRYPOINT ["/code.zip"]