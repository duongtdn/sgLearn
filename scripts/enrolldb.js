"use strict"

const Database = require('database-abstractor');

const enrollDB = new Database();

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
    enrollDB.use(require('enrolldb-dynamodb-driver')(
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
    const self = this;
    if (this._dbready) {
      enrollDB.createTable(err => {
        if (err) {
          console.error('Failed to create ENROLL Table');
          throw new Error(err)
        }
        console.log('Created new ENROLL table')
        self._createNewEntry();
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
      enrollDB.dropTable(err => {
        if (err) {
          console.log('Failed to drop ENROLL table')
          throw new Error(err)
        }
        console.log('Dropped old ENROLL table')  
        enrollDB.createTable(err => {
          if (err) {
            console.error('Failed to create ENROLL Table');
            throw new Error(err)
          }
          console.log('Created new ENROLL table')
          self._createNewEntry();
        })
      })
    } else {
      this.queue.push('reset')
    }
    return this;
  },

  _createNewEntry() {

    // create entry for test user for test
    const uid = 'tester-uid';
    const courseId = 'emb-01';
    const detail = { status: 'active'};
    const price = 500;
    
    enrollDB.createEnroll({ uid, courseId, detail, price }, (err, data) => {
      if (err) {
        throw new Error (err)
      }
      // setTimeout(() => {
      //   console.log('Created enroll for test user')
      //   enrollDB.getEnroll({uid, courseId}, (err, data) => {
      //     if (err) {
      //       throw new Error (err)
      //     }
      //     console.log(data)
      //   })
      // },1000)   
    })

    detail.status = 'billing';
    enrollDB.createEnroll({ uid, courseId: 'emb-02', detail, price }, (err, data) => {
      if (err) {
        throw new Error (err)
      } 
    })


  }

}

