
"use strict"

/**
 * currently support GIT only
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');

function clone(url) {
  const repo = url.split('/').pop();

  if (fs.existsSync(repo)) {
    console.log(`${repo} exist`);
    return this;
  }

  const proc = spawn('git', ['clone', url]);

  // proc.stdout.on('data', (data) => console.log(`${data}`));
  // proc.stderr.on('data', (data) => console.log(`${data}`));

  return this;

}

function cloneSync(url) {
  const repo = url.split('/').pop();

  if (fs.existsSync(repo)) {
    console.log(`${repo} exist`);
    return this;
  }

  const proc = spawnSync('git', ['clone', url]);

  return this;
}

module.exports = { clone, cloneSync };