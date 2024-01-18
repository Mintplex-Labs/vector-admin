# Setup base image
FROM ubuntu:jammy-20230522 AS base

# Install system dependencies
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
        curl gnupg libgfortran5 python3 python3-pip tzdata netcat \
        libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
        libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 \
        libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
        libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release \
        xdg-utils && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -yq --no-install-recommends nodejs && \
    curl -LO https://github.com/yarnpkg/yarn/releases/download/v1.22.19/yarn_1.22.19_all.deb \
        && dpkg -i yarn_1.22.19_all.deb \
        && rm yarn_1.22.19_all.deb && \
    if [ "$(uname -m)" =  "aarch64" ] || [ "$(uname -m)" =  "arm64" ] || [ "$(uname -m)" = "armv7l" ]; \
    then \
    curl -L https://github.com/jgm/pandoc/releases/download/3.1.3/pandoc-3.1.3-1-arm64.deb > pandoc-3.1.3-1.deb; \
    else \
    curl -L https://github.com/jgm/pandoc/releases/download/3.1.3/pandoc-3.1.3-1-amd64.deb > pandoc-3.1.3-1.deb; \
    fi \
    && dpkg -i pandoc-3.1.3-1.deb \
    && rm pandoc-3.1.3-1.deb && \
    rm -rf /var/lib/apt/lists/* /usr/share/icons && \
    dpkg-reconfigure -f noninteractive tzdata && \
    python3 -m pip install --no-cache-dir virtualenv

# Create folder struct
RUN mkdir -p /app/frontend/ /app/backend/ /app/workers/ /app/document-processor/

# Copy docker helper scripts
COPY ./docker/docker-entrypoint.sh /usr/local/bin/
COPY ./docker/docker-healthcheck.sh /usr/local/bin/

# Ensure the scripts are executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-healthcheck.sh

WORKDIR /app
USER root

# Install frontend dependencies
FROM base as frontend-deps
COPY ./frontend/package.json ./frontend/yarn.lock ./frontend/
RUN cd ./frontend/ && yarn install  --network-timeout 100000 && yarn cache clean

# Install server dependencies
FROM base as server-deps
COPY ./backend/package.json ./backend/yarn.lock ./backend/
RUN cd ./backend/ && yarn install --production  --network-timeout 100000 && yarn cache clean 

# Build the frontend
FROM frontend-deps as build-stage
COPY ./frontend/ ./frontend/
RUN cd ./frontend/ && yarn build && yarn cache clean

# Setup the server
FROM server-deps as production-stage
COPY ./backend/ ./backend/ 

# Copy built static frontend files to the server public directory
COPY --from=build-stage /app/frontend/dist ./backend/public

# Copy worker source files 
COPY ./workers/ ./workers/

# Install worker dependencies
RUN cd /app/workers && \
    yarn install --production --network-timeout 100000 && \
    yarn cache clean && \
    yarn add global inngest-cli --network-timeout 100000

# Copy the document-processor
COPY ./document-processor/ ./document-processor/

# Install document-processor dependencies
RUN cd /app/document-processor && \
    python3 -m virtualenv v-env && \
    . v-env/bin/activate && \
    pip install --no-cache-dir -r requirements.txt

# Setup the environment
ENV NODE_ENV=production
ENV PATH=/app/document-processor/v-env/bin:$PATH

# Expose the server port
EXPOSE 3001
EXPOSE 3355
EXPOSE 8288

# Setup the healthcheck
HEALTHCHECK --interval=1m --timeout=10s --start-period=1m \
  CMD /bin/bash /usr/local/bin/docker-healthcheck.sh || exit 1

# Run the server
ENTRYPOINT ["/bin/bash", "/usr/local/bin/docker-entrypoint.sh"]
