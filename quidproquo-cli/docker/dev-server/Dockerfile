# Runtime image for `qpq go` on the docker platform: the QPQ dev server
# (a full local platform emulation — sqlite KVS, file storage, queues,
# websockets) hosting every service of the app, plus the pre-built views.
#
# The server bundle externalizes bare packages (native modules must load from
# a real install), so runtime deps are npm-installed in the image, then the
# locally-built quidproquo packages are overlaid so the image runs the same
# qpq code the bundle was built against.
FROM node:24-trixie-slim

WORKDIR /app

# Runtime deps (package.json is the consumer root's, with workspaces/scripts
# stripped by the assemble step). Slow but correct: natives compile for linux.
# vendor/ must be present before the install: consumers on file: refs have
# their quidproquo deps rewritten to file:./vendor/<pkg> so npm can resolve
# them (and their transitive deps) inside the context.
COPY vendor/ ./vendor/
COPY package.json ./
RUN npm install --omit=dev

# Overlay the locally-built quidproquo packages over the installed ones.
# npm leaves file:./vendor deps as symlinks and registry deps as real
# directories — rm+cp replaces either shape with the vendored code (a plain
# COPY cannot write a directory over a symlink).
RUN set -e; for d in ./vendor/*/; do \
      [ -d "$d" ] || continue; \
      pkg="$(basename "$d")"; \
      rm -rf "./node_modules/$pkg"; \
      cp -a "$d" "./node_modules/$pkg"; \
    done

COPY server/ ./server/
COPY web/ ./web/

ENV QPQ_WEB_ROOT=/app/web
ENV NODE_ENV=production

# api / websocket / file-storage secure urls
EXPOSE 8080 8888 3001

# Emulated platform state (KVS JSON files + file storage) lives here — mount
# a volume to persist it across container restarts.
VOLUME /app/.qpq-runtime

CMD ["node", "server/main.js"]
