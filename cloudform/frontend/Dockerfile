FROM node:12

RUN groupadd -r nodejs && useradd -m -r -g nodejs nodejs && mkdir /workspace && chown -R nodejs: /workspace

USER nodejs

WORKDIR /workspace
COPY --chown=nodejs package-lock.json package.json /workspace/
RUN ls -lah /home/nodejs && npm ci

COPY --chown=nodejs . /workspace

CMD npm run start
