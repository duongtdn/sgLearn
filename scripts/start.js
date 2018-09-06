"use strict"

require('dotenv').config()

const { spawnSync } = require('child_process');
const fs = require('fs')
const db = require('database-test-helper')
const npm = require('./npm')

const project = {
  _tables: [],
  _buildList: {},
  _apiServers: [],
  _alias: {},

  alias(name, aliasName) {
    this._alias[name] = aliasName;
  },

  startDB(tables) {

    this._tables = tables;

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

  },

  rebuild(buildList) {    
    
    if (!buildList || buildList.length === 0) {
      return
    }

    const cpath = process.cwd();

    const _build = (target) => {
      console.log(`  --> building: ${target}`)  
      process.chdir(target)
      npm.runSync('build')
    }

    if (typeof buildList === 'string') {
      const module = buildList;
      if (this._buildList[module]) {
        const target = this._buildList[module];
        _build(target);
        process.chdir(cpath);
        console.log(`  --> buid completed`)
      } else {
        console.log(` Error: ${module} is not in build list`)
      }
      
      return
    }

    const _rebuild = (dir, path) => {
      for (let name in path) {
        if (typeof path[name] === 'object') {      
          _rebuild(`${dir}/${name}`, path[name])
        } else {           
          if (buildList.indexOf(name) !== -1) {
            const target = `${dir}/${name}`
            _build(target);
            this._buildList[name] = target;
          }
        }
      }
    }
    
    const fp = fs.readFileSync('project.json');
    if (!fp) {
      throw new Error("Error: Could not find project.json");
    }
  
    const _config = JSON.parse(fp);
    const _dir = _config.directory;      

  
    _rebuild(`${process.env.HOME}/work`,_dir)
  
    process.chdir(cpath);
  
  
  },


  startApiServers(servers) {
    this._apiServers = servers;

    servers.forEach(server => {
      _createApiServer(server)
    })

  },


  startStaticServer(statics) {
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
  },

  waitingUserCommand() {

    console.log('Waiting for command...\n')
    process.stdout.write(' > ');

    const stdin = process.openStdin();

    stdin.addListener("data", (data) => {
      const {command, target} = this._parseCommand(data.toString().trim().replace(/\s+/g, " "))
      
      if (command === 'rebuild') {
        this.rebuild(target)
      }

      if (command === 'restart') {
        this._restart(target)
      }

      console.log('Waiting for command...\n')
      process.stdout.write(' > ');

    })

  },

  _parseCommand(data) {

    const splittedCmd = data.split(' ');
    
    const command = splittedCmd[0];
    
    const target = this._alias[splittedCmd[1]] || splittedCmd[1];

    return { command, target }

  },

  _restart(target) {
    
  }

}



function _createApiServer(server) {
  const app = require(`${process.cwd()}/node_modules/${server.path}/example/app.local`)
  const PORT = process.env[`${server.name.toUpperCase()}_PORT`];
  const httpServer = require('http').createServer(app);
  httpServer.listen(PORT)
  console.log(`\n# ${server.path} is running at http://localhost:${PORT}\n`);
  return this;
}


async function start() {

  project.alias('sgw', 'sglearn-web-server');

  console.log('\nStarting Database... \n')

  await project.startDB([
      {name: 'userdb', helper: '@stormgle/userdb-test-helper'},
      {name: 'coursedb', helper: 'coursedb-test-helper'},
      {name: 'catalogdb', helper: 'catalogdb-test-helper'},
      {name: 'enrolldb', helper: 'enrolldb-test-helper'},
      {name: 'invoicedb', helper: 'invoicedb-test-helper'}
    ])

  console.log('\nRebuiding modules... \n')

  project.rebuild(['auth-client', 'react-user', 'sglearn-web-server'])

  console.log('\n Starting API Servers... \n')

  project.startApiServers([
      {name: 'auth', path: '@stormgle/account-base'},
      {name: 'purchase', path: 'purchase-server'},
      {name: 'enroll', path: 'enroll-server'},
      {name: 'course', path: 'course-server'},
      {name: 'sgweb', path: 'sglearn-web-server'}
    ])


  console.log('\nStarting Static Servers... \n')

  project.startStaticServer([
    {uri: '/sgw/course.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/course.js`},
    {uri: '/sgw/catalog.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/catalog.js`},
    {uri: '/sgw/enrolled.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/enrolled.js`}
  ])


  project.waitingUserCommand();

}

start();
