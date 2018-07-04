
"use strict"

/**
 * currently support GIT only
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');

function clone(url) {
  const repo = url.split('/').pop();  

  return new Promise((resolve, reject) => {

    if (fs.existsSync(repo)) {
      console.log(`${repo} exist`);
      fetch()
        .then(pull)
        .then(resolve)
        .catch(reject)

    } else {
      const proc = spawn('git', ['clone', url]);
      proc.stdout.on('data', (data) => console.log(`${data}`));
      proc.stderr.on('data', (data) => console.log(`${data}`));
      proc.on('close', code => {
        if (code === 0) {
          console.log(`Cloned ${repo}`)
          resolve(code)
        } else {
          reject(code)
        }
      }); 
    }    

  })  

}

function cloneSync(url) {
  const repo = url.split('/').pop();

  console.log(`Cloning ${repo} from ${url}`)

  if (fs.existsSync(repo)) {
    console.log(`${repo} exist`);
    return this;
  }

  const proc = spawnSync('git', ['clone', url]);
  console.log(`Cloned ${repo}`)

  return this;
}

function fetch() {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['fetch']);
    proc.stdout.on('data', (data) => console.log(`${data}`));
      proc.stderr.on('data', (data) => console.log(`${data}`));
      proc.on('close', code => {
        if (code === 0) {
          console.log(`Fetched`)
          resolve(code)
        } else {
          reject(code)
        }
      }); 
  })
}

function pull() {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['pull']);
    proc.stdout.on('data', (data) => console.log(`${data}`));
      proc.stderr.on('data', (data) => console.log(`${data}`));
      proc.on('close', code => {
        if (code === 0) {
          console.log(`Updated`)
          resolve(code)
        } else {
          reject(code)
        }
      }); 
  })
}

module.exports = { clone, cloneSync };