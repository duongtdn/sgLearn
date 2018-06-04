"use strict"

const UserDB = require('@stormgle/userdb-api');

const userdb = new UserDB();

const db = {
  host: null,
  port: null
}

module.exports = {

  _dbready: false,

  queue: [],

  use({host, port}) {
    db.host = host;
    db.port = port;

    userdb.use(require('@stormgle/userdb-dynamodb')(
      {
        region : 'us-west-2', 
        endpoint : `${db.host}:${db.port}`
      },
      (err) => {
        if (err) {
          console.log('Failed to init local db')
          throw new Error(err)
        } else {
          this._dbready = true;
          if (this.queue.length > 0) {
            this.queue.forEach(fn => this[fn].call(this))
          }
        }
      }
    ))

    return this;
  },

  new() {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    if (this._dbready) {
      userdb.createTable(function(err, data) {
        if (err) {
          console.log('Failed to create table')
          console.log(err);
        } else {  
          this._createUsers();
        }
      })
    } else {
      this.queue.push('new')
    }
  },

  reset () {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    const self = this;
    if (this._dbready) {
      userdb.dropTable(function(err, data) {
        if (err) {
          console.log('Failed to drop USERS table')
          console.log(err);
        } else {
          console.log('Dropped old USERS table')
          userdb.createTable((err, data) => {
            if (err) {
              console.log('Failed to create table')
              console.log(err);
            } else {  
              self._createUsers();
            }
          })
        }
      })
    } else {
      this.queue.push('reset')
    }
    return this;
  },

  _createUsers() {
    console.log('Created new USERS table')  
    userdb.createUser(
      {
        username: 'super@team.com',
        login: { password: 'qwe'},
        roles: ['super'],
        uid: 'super-amin-special-uid',
        profile: { email: ['super@team.com']}
      },
      () => {
        console.log('Super admin user is: super@team.com / qwe')
      }
    )         
    userdb.createUser(
      {
        username: 'admin@team.com',
        login: { password: 'qwe'},
        roles: ['admin','user'],
        uid: 'admin-special-uid',
        profile: { email: ['admin@team.com']}
      },
      () => {
        console.log('Admin user is: admin@team.com / qwe')
      }
    )
    userdb.createUser(
      {
        username: 'tester@team.com',
        login: { password: '123'},
        roles: ['user'],
        uid: 'tester-uid',
        profile: { email: ['tester@team.com']}
      },
      () => {
        console.log('Tester user is: tester@team.com / 123')
      }
    )
}
}

