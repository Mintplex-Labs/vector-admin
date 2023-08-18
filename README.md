<p align="center">
  <a href="https://twitter.com/tcarambat"><img src="https://github.com/Mintplex-Labs/vector-admin/blob/master/images/logo-light.png?raw=true" alt="VectorAdmin logo"></a>
</p>

<p align="center">
    <b>VectorAdmin: The universal interface for vector databases.</b>. <br />
    A production-ready vector database management system that doesn't hurt to use.
</p>

<p align="center">
 <a href="https://twitter.com/tcarambat" target="_blank">
      <img src="https://img.shields.io/twitter/url/https/twitter.com/tim.svg?style=social&label=Follow%20%40Timothy%20Carambat" alt="Twitter">
  </a> |
  <a href="https://discord.gg/6UyHPeGZAC" target="_blank">
      <img src="https://dcbadge.vercel.app/api/server/6UyHPeGZAC?compact=true&style=flat" alt="Discord">
  </a> |
  <a href="https://github.com/Mintplex-Labs/vector-admin/blob/master/LICENSE" target="_blank">
      <img src="https://img.shields.io/static/v1?label=license&message=MIT&color=white" alt="License">
  </a> |
  <a href="https://github.com/Mintplex-Labs/anything-llm" target="_blank">
      AnythingLLM
  </a> |
  <a href="https://docs.mintplex.xyz/vectoradmin-by-mintplex-labs/" target="_blank">
    Docs [WIP]
  </a>
</p>

**Quick!** Can you tell me _exactly_ what information is embedded in your Pinecone or Chroma vector database? I bet you can't. While those teams are focusing on building the underlying architecture we made it easier for you to _manage_ vector data without the headaches and API calls.

We call it **VectorAdmin** and we want to be the best universal GUI for vector database management.

![Managing VectorData](/images/screenshots/org_home.png)
[view more screenshots](/images/screenshots/SCREENSHOTS.md)

### Watch the demo!
[![Watch the video](/images/youtube.png)](https://youtu.be/cW8Eohz6pzs)

### Product Overview
VectorAdmin aims to be a full-stack application that gives you total control over your otherwise unwieldy vector data that you are embedding via an API or using tools like LangChain, which don't show you want you just saved into your database.

VectorAdmin is a full capable multi-user product that you can run locally via Docker as well as host remotely and manage multiple vector databases at once.

VectorAdmin is more than a single tool. VectorAdmin is a **suite** of tools that make interacting with and understanding vectorized text easy without compromise for the controls you would expect from a traditional database management system.

Some cool features of VectorAdmin
- Multi-user instance support and oversight
- Atomically view, update, and delete singular text chunks of embeddings.
- Copy entire documents or even whole namespaces and embeddings without paying to re-embed.
- Upload & embed new documents directly into the vector database.
- Migrate an entire existing vector database to another type or instance. _still in progress_
- Manage multiple concurrent vector databases at once.
- Permission data and access to data
- 100% Cloud deployment ready.
- Automated regression testing that run as namespaces or collections are updated with new documents to ensure response quality. _still in progress_
- Full API, Javascript, and Python standalone client and LangChain integration. _still in progress_
- Extremely efficient cost-saving measures for managing very large documents. You'll never pay to embed a massive document or transcript more than once.

### Technical Overview
This monorepo consists of three main sections:
- `document-processor`: Flask app to digest, parse, and embed documents easily.
- `frontend`: A viteJS + React frontend that you can run to easily create and manage all your content.
- `backend`: A nodeJS + express server to handle all the interactions and do all the vectorDB management.
- `workers`: An InngestJS instance to handle long-running processes background tasks for snappy performance.
- `docker`: Run this entire arch in a single command as a docker instance _recommended_.

### Requirements
- `yarn` and `node` on your machine
- `python` 3.9+ for running scripts in `document-processor/`.
- access to an OpenAI API key if planning to update embeddings or upload new documents.
- a [Pinecone.io](https://pinecone.io) free account or a running [ChromaDB](https://trychroma.com) instance.


## How to get started (Docker - simple setup)
[Get up and running in minutes with Docker](./docker/DOCKER.md)


### How to get started (Development environment)
The below instructions will **not** work on Windows.

- `yarn dev:setup` from the project root directory.
- `cd document-processor && python3.9 -m virtual-env v-env && source v-env/bin/activate && pip install -r requirements.txt`

In separate terminal windows from project root:
  - `yarn dev:server`
  - `yarn dev:frontend`
  - `yarn dev:workers`
  - `cd document-processor && flask run --host '0.0.0.0' --port 8888`

On first boot of the system you will be prompted to login. Consult the `backend/.env.development` and set or use the `SYS_EMAIL` and `SYS_PASSWORD` values. Once your new account is setup the root credentials will no longer work and you can use your admin account.

### Contributing
- create issue
- create PR with branch name format of `<issue number>-<short name>`
- yee haw let's merge
