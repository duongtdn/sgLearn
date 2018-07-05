"use strict"

const { spawn, spawnSync } = require('child_process');

const config = require('./config')

function linkSync(module) {
  const command = ['link'];
  module && command.push(module);
  const p = spawnSync('npm', command);
  config.__verbose && console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

function unlinkSync(module) {
  const command = ['unlink'];
  module && command.push(module);
  const p = spawnSync('npm', command);
  config.__verbose && console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

function installSync() {
  const p = spawnSync('npm', ['install']);
  config.__verbose && console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

function install() {
  return new Promise((resolve, reject) => {
    const p = spawn('npm', ['install']);
    p.on('close', code => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(code)
      }
    })

    if (config.__verbose) {
      proc.stdout.on('data', (data) => console.log(`${data}`));     
    }
    proc.stderr.on('data', (data) => console.log(`${data}`));
    
  })
}

function link(module) {
  return new Promise((resolve, reject) => {
    const command = ['link'];
    module && command.push(module);
    const p = spawn('npm', command);
    p.on('close', code => {
      if (code === 0) {
        console.log('\n\nDone linking module: ' + module)
        resolve(code)
      } else {
        reject(code)
      }
    })

    if (config.__verbose) {
      p.stdout.on('data', (data) => console.log(`${data}`));      
    }
    p.stderr.on('data', (data) => console.log(`${data}`));

  })
}

module.exports = { link, linkSync, unlinkSync, install, installSync }