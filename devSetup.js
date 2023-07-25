const fs = require('fs');
const path = require('path');

const serverEnvTemplate = path.resolve(__dirname, 'backend/.env.example');
const serverEnv = path.resolve(__dirname, 'backend/.env.development')
const frontendEnvTemplate = path.resolve(__dirname, 'frontend/.env.example');
const frontendEnv = path.resolve(__dirname, 'frontend/.env')
const workerEnvTemplate = path.resolve(__dirname, 'workers/.env.example');
const workerEnv = path.resolve(__dirname, 'workers/.env')

if (!fs.existsSync(serverEnv)) {
  console.log("Copying server env file template.");
  fs.writeFileSync(serverEnv, '');
  fs.copyFileSync(serverEnvTemplate, serverEnv);
  console.log("Server env file created.");
}

if (!fs.existsSync(frontendEnv)) {
  console.log("Copying frontend env file template.");
  fs.writeFileSync(frontendEnv, '');
  fs.copyFileSync(frontendEnvTemplate, frontendEnv);
  console.log("Frontend env file created.");
}

if (!fs.existsSync(workerEnv)) {
  console.log("Copying workers env file template.");
  fs.writeFileSync(workerEnv, '');
  fs.copyFileSync(workerEnvTemplate, workerEnv);
  console.log("Workers env file created.");
}