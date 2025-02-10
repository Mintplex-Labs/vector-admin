# Running VectorAdmin in Docker

Running VectorAdmin in Docker is the easily way to get a locally hosted option running as quickly as possible.

## Requirements
- Install [Docker](https://www.docker.com/) on your computer or machine.
- A running Postgres DB (RDS, remote, docker, local host machine)

**Note**  Failure to use a valid DB connection string prior to building or starting vector-admin will result in a failure.
On boot the `vdbms` database will be created using the connection string.

**Run containerized Postgres DB**
Run this command first to get a dockerized Postgres container running:
`docker-compose up -d --build postgres`

## Run from Docker pre-built image
- `docker pull mintplexlabs/vectoradmin` to pull in latest image
- Run the command with env variables and image defined.
```shell
docker run -d -p 3001:3001 \
--name vectoradmin \
-e SERVER_PORT="3001" \
-e JWT_SECRET="your-random-string-here" \
-e INNGEST_EVENT_KEY="background_workers" \
-e INNGEST_SIGNING_KEY="random-string-goes-here" \
-e INNGEST_LANDING_PAGE="true" \
-e DATABASE_CONNECTION_STRING="postgresql://vectoradmin:password@xxxxxxx:5432/vdbms" \
mintplexlabs/vectoradmin
```


## Build docker image from source
- `git clone git@github.com:Mintplex-Labs/vector-admin.git`
- `cd vector-admin`
- `cd docker/`
- `cp .env.example .env`.
- Edit `.env` file and update the variables. **please** update all of the following:
```shell
JWT_SECRET="some-random-string"
DATABASE_CONNECTION_STRING="postgresql://vectoradmin:password@host.docker.internal:5433/vdbms" # Valid PG Connection string.
INNGEST_SIGNING_KEY="some-random-string"
```
- `docker-compose up -d --build vector-admin`


## How to use the user interface and login for the first time.
- To access the full application, visit `http://localhost:3001` in your browser.
- You will automatically be redirected into onboarding to create your primary admin account, organization, and vector database connection.

# Connecting to a Vector Database

**Pinecone**
Once your organization is connected you will need to put in your Pinecone configuration and keys. Once connected you may see a `Sync Pinecone Data` button on the organization homepage. This indicates there is existing data in your vector database that can be pulled in. If syncing, the time to sync is dependent on how many documents you have embedded in Pinecone. Otherwise, you can just create a workspace and add documents via the UI.

**Chroma** _running locally_
When trying to connect to a Chroma instance running also on the same machine use `http://host.docker.internal:[CHROMA_PORT]` as the URL to connect with.

Once connected you may see a `Sync Chroma Data` button on the organization homepage. This indicates there is existing data in your vector database that can be pulled in. If syncing, the time to sync is dependent on how many documents you have embedded in Chroma. Otherwise, you can just create a workspace and add documents via the UI.


## Common questions and fixes

### API is not working, cannot login?
You are likely running the docker container on a remote machine like EC2 or some other instance where the reachable URL
is not `http://localhost:3001` and instead is something like `http://193.xx.xx.xx:3001` - in this case all you need to do is add the following to your `frontend/.env.production` before running `docker-compose up -d --build`
```
# frontend/.env.production
GENERATE_SOURCEMAP=false
VITE_APP_NAME="Vector Admin"
VITE_API_BASE="http://<YOUR_REACHABLE_IP_ADDRESS>:3001/api"
```
For example, if the docker instance is available on `192.186.1.222` your `VITE_API_BASE` would look like `VITE_API_BASE="http://192.186.1.222:3001/api"` in `frontend/.env.production`.

### Still not working?
[Ask for help on Discord](https://discord.gg/6UyHPeGZAC)
