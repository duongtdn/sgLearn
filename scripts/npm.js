"use strict"

const { spawn, spawnSync } = require('child_process');

function link(module) {
  if (module) {
    return _npmLinkModule(module)
  } else {
    return _npmLink()
  }
}

function unlink(module) {
  if (module) {
    return _npmUnLinkModule(module)
  } else {
    return _npmUnLink()
  }
}

function install() {
  const p = spawnSync('npm', ['install']);
  console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

function _npmLink() {
  const p = spawnSync('npm', ['link']);
  console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

function _npmLinkModule(module) {
  const p = spawnSync('npm', ['link', module]);
  console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

function _npmUnLink() {
  const p = spawnSync('npm', ['unlink']);
  console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

function _npmUnLinkModule(module) {
  const p = spawnSync('npm', ['unlink', module]);
  console.log(`${p.stdout}`)
  console.log(`${p.stderr}`)
  return p;
}

module.exports = { link, unlink, install }