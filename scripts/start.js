"use strict"

require('dotenv').config()

const { spawnSync } = require('child_process');
const fs = require('fs')
const db = require('database-test-helper')
const npm = require('./npm')

const project = {
  _tables: [],
  _buildList: {},
  _servers: {},
  _alias: {},
  _revertAlias: {},
  _history: [],

  alias(name, aliasName) {
    this._alias[name] = aliasName;
    this._revertAlias[aliasName] = name;
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
      const module = this._alias[buildList] || buildList;
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
    servers.forEach(server => {
      const serverName = this._alias[server.name] || server.name;
      this._servers[serverName] = {
        __httpServer: this._createApiServer(server),
        __apiPath: server.path
      } 
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

    this._servers['static-server'] = {
      __httpServer: httpServer,
      __apiPath: ''
    };

    return this;
  },

  waitingUserCommand() {

    console.log('Waiting for command...\n')

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'sglearn > '
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const {command, target} = this._parseCommand(line.toString().trim().replace(/\s+/g, " "))
      switch (command) {
        case 'rebuild':
          this.rebuild(target)
          break;
        case 'restart':
          await this._restart(target)
          break;
        default:
          console.log(`Invalid command`);
          break;
      }
      rl.prompt();
    }).on('close', () => {
      console.log('Have a great day!');
      process.exit(0);
    });

  },

  _parseCommand(data) {

    const splittedCmd = data.split(' ');
    
    const command = splittedCmd[0];
    
    const target = splittedCmd[1];

    return { command, target }

  },

  _restart(target) {
    return new Promise((resolve, reject) => {
      const serverName = this._alias[target] || target;
      if (this._servers[serverName]) {
        const _server = this._servers[serverName].__httpServer;
        console.log(`# closing ${serverName}`)
        _server.close(() => {
          console.log(`# closed ${serverName}`)
          if (this._buildList[serverName]) {
            this.rebuild(target)
          }
          const server = {
            name: this._revertAlias[target] || target,
            path: this._servers[serverName].__apiPath
          };
          this._servers[serverName] = {
            __httpServer: this._createApiServer(server),
            __apiPath: server.path
          }
          resolve();
        }); 
      } else {
        reject('server not found')
      }
    })
    
  },

  _createApiServer(server) {    
    const api = `${process.cwd()}/node_modules/${server.path}/example/app.local`;
    const app = require(api)
    const PORT = process.env[`${server.name.toUpperCase()}_PORT`];
    const httpServer = require('http').createServer(app);
    httpServer.listen(PORT)
    console.log(`\n# ${this._alias[server.name] || server.name} is running at http://localhost:${PORT}\n`);
    return httpServer;
  }

}





async function start() {

  project.alias('sgw', 'sglearn-web-server');
  project.alias('auth', 'account-base');
  project.alias('purchase', 'purchase-server');
  project.alias('enroll', 'enroll-server');
  project.alias('course', 'course-server');
  project.alias('dashboard', 'dashboard-server');
  project.alias('content', 'content-server');
  project.alias('progress', 'progress-server');
  project.alias('static', 'static-server');


  console.log('\nStarting Database... \n')

  await project.startDB([
      {name: 'userdb', helper: '@stormgle/userdb-test-helper'},
      {name: 'coursedb', helper: 'coursedb-test-helper'},
      {name: 'catalogdb', helper: 'catalogdb-test-helper'},
      {name: 'enrolldb', helper: 'enrolldb-test-helper'},
      {name: 'invoicedb', helper: 'invoicedb-test-helper'},
      {name: 'contentdb', helper: 'contentdb-test-helper'},
      {name: 'progressdb', helper: 'progressdb-test-helper'}
    ])

  console.log('\nRebuiding modules... \n')

  project.rebuild([
    'auth-client', 
    'react-user', 
    // 'sglearn-web-server',
    'content-presenter',
    'quiz-player-plugin',
    'youtube-player-plugin',
    'quiz-embed'
  ])

  console.log('\nStarting API Servers... \n')

  project.startApiServers([
      {name: 'auth', path: '@stormgle/account-base'},
      {name: 'purchase', path: 'purchase-server'},
      {name: 'enroll', path: 'enroll-server'},
      {name: 'course', path: 'course-server'},
      // {name: 'sgw', path: 'sglearn-web-server'},
      {name: 'dashboard', path: 'dashboard-server'},
      {name: 'content', path: 'learndesk-content-server'},
      {name: 'progress', path: 'progress-server'},
    ])


  console.log('\nStarting Static Servers... \n')

  project.startStaticServer([
    {uri: '/sgw/course.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/course.js`},
    {uri: '/sgw/catalog.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/catalog.js`},
    {uri: '/sgw/enrolled.js', path: `${process.env.HOME}/work/packages/sglearn/sglearn-web-server/dist/enrolled.js`},
    
    {uri: '/quiz/quiz_api.js', path: `${process.env.HOME}/work/packages/learndesk/quiz-embed/build/api.bundle.js`},
    {uri: '/quiz/player.bundle.js', path: `${process.env.HOME}/work/packages/learndesk/quiz-embed/build/player.bundle.js`},
    {uri: '/quiz/index.html', path: `${process.env.HOME}/work/packages/learndesk/quiz-embed/example/index.html`},
    {uri: '/quiz/quiz.css', path: `${process.env.HOME}/work/packages/learndesk/quiz-embed/example/css/quiz.css`},

    {uri: '/ldw/app.css', path: `${process.env.HOME}/work/packages/learndesk/learndesk-web/src/css/app.css`},
    
  ])


  project.waitingUserCommand();

}

start();
