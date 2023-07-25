#!/bin/bash

trap 'trap - SIGTERM && kill -9 $(lsof -t -i tcp:3355) && kill -9 $(lsof -t -i tcp:8288)' SIGINT SIGTERM EXIT &\
NODE_ENV=development npx nodemon --trace-warnings index.js 2>&1 | tee ./logs/nodelog.log &\
npx inngest-cli dev -u http://127.0.0.1:3355/background-workers 2>&1 | tee ./logs/worker.log
