FROM --platform=$TARGETOS/$TARGETARCH node:24-alpine

LABEL author="Helkor Hosting" maintainer="kontakt@helkor.eu"

RUN         apk add --update --no-cache ca-certificates curl ffmpeg git openssl sqlite tar tzdata \
	&& adduser -D -h /home/container container

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /app
WORKDIR /app
RUN rm -rf .env node_modules
RUN pnpm install --frozen-lockfile

COPY ./deploy/helkor/entrypoint.sh /entrypoint.sh

USER        container
ENV         USER=container HOME=/home/container
WORKDIR     /home/container

ENV         USER=container HOME=/home/container

USER	container
ENV FILE_PATH=/home/container

CMD [ "/bin/ash", "/entrypoint.sh" ]
