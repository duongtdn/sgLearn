
"use strict"

/**
 * currently support GIT only
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');

const config = require('./config')

function clone(url) {
  const repo = url.split('/').pop();  

  return new Promise((resolve, reject) => {

    if (fs.existsSync(repo)) {
      console.log(`${repo} exist`);
      const path = `${process.cwd()}/${repo}`;
      fetch(path)
        .then(() => pull(path))
        .then(resolve)
        .catch(reject)
    } else {
      const proc = spawn('git', ['clone', url]);
      proc.on('close', code => {
        if (code === 0) {
          console.log(`Cloned ${repo}`)
          resolve(code)
        } else {
          reject(code)
        }
      });
      if (config.__verbose) {
        proc.stdout.on('data', (data) => console.log(`${data}`));
        proc.stderr.on('data', (data) => console.log(`${data}`));         
      }
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

function fetch(path) {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    process.chdir(path);

    const proc = spawn('git', ['fetch']);
    process.chdir(cwd);
    
    proc.on('close', code => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(code)
      }
    }); 

    if (config.__verbose) {
      proc.stdout.on('data', (data) => console.log(`${data}`));
      proc.stderr.on('data', (data) => console.log(`${data}`));
    }

  })
}

function pull(path) {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    process.chdir(path);

    const proc = spawn('git', ['pull']);
    process.chdir(cwd);

    proc.on('close', code => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(code)
      }
    }); 
    
    if (config.__verbose) {
      proc.stdout.on('data', (data) => console.log(`${data}`));
      proc.stderr.on('data', (data) => console.log(`${data}`));
    }
  })
}

module.exports = { clone, cloneSync };