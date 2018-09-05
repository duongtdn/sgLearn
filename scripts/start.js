"use strict"

require('dotenv').config()

const { spawnSync } = require('child_process');
const fs = require('fs')
const db = require('database-test-helper')
const npm = require('./npm')


function startDB(tables) {
  return new Promise((resolve, reject) => {
    const _tables = {};
    tables.forEach(table => {
      _tables[table.name] = require(table.helper)
    })
    db.start().add(_tables).init(() => {
      console.log("Database is ready")
      resolve();
    })
  })
}

function rebuild(buildList) {

  if (!buildList || buildList.length === 0) {
    return
  }

  const fp = fs.readFileSync('project.json');
  if (!fp) {
    throw new Error("Error: Could not find project.json");
  }

  const _config = JSON.parse(fp);
  const _dir = _config.directory;      

  const cpath = process.cwd();

  _rebuild(`${process.env.HOME}/work`,_dir)

  process.chdir(cpath);



  function _rebuild(dir, path) {
    for (let name in path) {
      if (typeof path[name] === 'object') {      
        _rebuild(`${dir}/${name}`, path[name])
      } else {           
        if (buildList.indexOf(name) !== -1) {
          const target = `${dir}/${name}`
          console.log(`  --> building: ${target}`)  
          process.chdir(target)
          npm.runSync('build')
        }
      }
    }
  }

}


function startApiServers(servers) {
  servers.forEach(server => {
    _createApiServer(server)
  })
}

function _createApiServer(server) {
  const app = require(`${process.cwd()}/node_modules/${server.path}/example/app.local`)
  const PORT = process.env[`${server.name.toUpperCase()}_PORT`];
  const httpServer = require('http').createServer(app);
  httpServer.listen(PORT)
  console.log(`\n# ${server.path} is running at http://localhost:${PORT}\n`);
  return this;
}

function startStaticServer(statics) {
  const app = require('express')();  
  statics.forEach(s => {
    app.get(s.uri, (req, res) => {
      res.sendFile(s.path)
    })
  })

  const PORT = process.env.STATIC_PORT;
  const httpServer = require('http').createServer(app);
  httpServer.listen(PORT)
  console.log(`\n# Static server is running at http://localhost:${PORT}\n`);
  return this;
}



async function start() {

  console.log('\n Starting Database... \n')

  await startDB([
    {name: 'userdb', helper: '@stormgle/userdb-test-helper'},
    {name: 'coursedb', helper: 'coursedb-test-helper'},
    {name: 'catalogdb', helper: 'catalogdb-test-helper'},
    {name: 'enrolldb', helper: 'enrolldb-test-helper'},
    {name: 'invoicedb', helper: 'invoicedb-test-helper'}
  ])

  console.log('\n Rebuiding modules... \n')

  rebuild(['auth-client', 'react-user', 'sglearn-web-server'])

  console.log('\n Starting API Servers... \n')

  startApiServers([
    {name: 'auth', path: '@stormgle/account-base'},
    {name: 'purchase', path: 'purchase-server'},
    {name: 'enroll', path: 'enroll-server'},
    {name: 'sgweb', path: 'sglearn-web-server'}
  ])

  console.log('\n Starting Static Servers... \n')

  startStaticServer([
    {uri: '/sgw/course.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/course.js`},
    {uri: '/sgw/catalog.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/catalog.js`},
    {uri: '/sgw/enrolled.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/enrolled.js`}
  ])

}

start();
