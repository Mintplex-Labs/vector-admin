# Running VectorAdmin in Docker

Running VectorAdmin in Docker is the easily way to get a locally hosted option running as quickly as possible.


## Requirements
- Install [Docker](https://www.docker.com/) on your computer or machine.

## How to install
- `git clone` this repo and `cd vector-admin` to get to the root directory.
- `yarn dev:setup`
- `cd docker/`
- `cp .env.example .env` to create the `.env` file.
- Edit `.env` file and update the variables. **please** update `JWT_SECRET`,`SYS_PASSWORD`, and `INNGEST_SIGNING_KEY`.
- `docker-compose up -d --build` to build the image - this will take a few moments.

Your docker host will show the image as online once the build process is completed. This will build the app to `http://localhost:3001`.


## How to use the user interface
- To access the full application, visit `http://localhost:3001` in your browser.
- You first login will require you to use the `SYS_EMAIL` and `SYS_PASSWORD` set in the `.env` file. After onboarding this login will be permanently disabled.


# Connecting to a Vector Database

**Pinecone**
Once your organization is connected you will need to put in your Pinecone configuration and keys. Once connected you may see a `Sync Pinecone Data` button on the organization homepage. This indicates there is existing data in your vector database that can be pulled in. If syncing, the time to sync is dependent on how many documents you have embedded in Pinecone. Otherwise, you can just create a workspace and add documents via the UI.

**Chroma** _running locally_
When trying to connect to a Chroma instance running also on the same machine use `http://host.docker.internal:[CHROMA_PORT]` as the URL to connect with.

Once connected you may see a `Sync Chroma Data` button on the organization homepage. This indicates there is existing data in your vector database that can be pulled in. If syncing, the time to sync is dependent on how many documents you have embedded in Chroma. Otherwise, you can just create a workspace and add documents via the UI.
