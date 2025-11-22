FROM --platform=$TARGETOS/$TARGETARCH node:24-alpine

LABEL author="Helkor Hosting" maintainer="kontakt@helkor.eu"

RUN         apk add --update --no-cache ca-certificates curl ffmpeg git openssl sqlite tar tzdata \
	&& adduser -D -h /home/container container

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm

ENV FILE_PATH=/home/container

COPY . /app
COPY ./deploy/helkor/entrypoint.sh /entrypoint.sh

WORKDIR /app
RUN rm -rf .env node_modules
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

USER        container
ENV         USER=container HOME=/home/container


CMD [ "/bin/ash", "/entrypoint.sh" ]
