# Build context is the REPO ROOT, not this directory:
#   docker build -f artifacts/api-server/Dockerfile -t comeback-api .
#
# A Dockerfile rather than platform auto-detection because this is a pnpm
# workspace with a catalog and a `minimumReleaseAge` policy; Nixpacks and
# friends routinely mis-detect the install step and build the wrong package.
#
# esbuild bundles every dependency into dist/, so the runtime stage carries no
# node_modules at all — just Node and the bundle.

# ---------------------------------------------------------------------------
# Stage 1 — install and build
# ---------------------------------------------------------------------------
FROM node:24-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# EVERY workspace manifest, even packages this image never builds: pnpm matches
# the lockfile's importer set against what it finds on disk, and a missing
# package.json makes `--frozen-lockfile` fail. Sources are copied selectively
# below, so this stays cheap.
COPY artifacts/api-server/package.json     artifacts/api-server/
COPY artifacts/career-tracker/package.json artifacts/career-tracker/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json     lib/api-client-react/
COPY lib/api-spec/package.json             lib/api-spec/
COPY lib/api-zod/package.json              lib/api-zod/
COPY lib/db/package.json                   lib/db/
COPY scripts/package.json                  scripts/

# Only the API server and the packages it imports. `--frozen-lockfile` makes a
# stale lockfile fail the build rather than silently resolving something else.
RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

COPY tsconfig.base.json tsconfig.json ./
COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/

RUN pnpm --filter @workspace/api-server run typecheck \
 && pnpm --filter @workspace/api-server run build

# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
FROM node:24-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /repo/artifacts/api-server/dist ./dist

# Drop root before running anything network-facing.
USER node

# Overridden by the platform — Railway, Render and Fly all inject PORT.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
