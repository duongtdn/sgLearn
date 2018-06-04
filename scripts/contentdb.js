"use strict"

const Database = require('database-abstractor');

const contentDB = new Database();

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
    contentDB.use(require('contentdb-dynamodb-driver')(
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
      contentDB.createTable(err => {
        if (err) {
          console.error('Failed to create CONTENT Table');
          throw new Error(err)
        }
        console.log('Created new CONTENT table')
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
      contentDB.dropTable(err => {
        if (err) {
          console.log('Failed to drop CONTENT table')
          throw new Error(err)
        }
        console.log('Dropped old CONTENT table')  
        contentDB.createTable(err => {
          if (err) {
            console.error('Failed to create CONTENT Table');
            throw new Error(err)
          }
          console.log('Created new CONTENT table')
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

    const data = [
      {
        id: '1', 
        title: 'Topic 1 is the first topic, id define topic number',
        contents: [
          {
            id: 0, player: 'YOUTUBE', src: 'r6bkETisayg', title: 'Nick and Dave Conversation',
            sub: {
              0: {
                id: 0, player: 'QUIZ', src: 'quiz1', title: 'Quiz 1 for test',
                sub: {0: {id: 0, player: 'QUIZ', src: 'quiz2', title: 'Quiz 2 for test',}}
              },
            }
          },
          {
            id: 1, player: 'YOUTUBE', src: 'X6a9odk6b_c', title: 'How to make friend and infulence people',
          },
        ]
      },
      {
        id: '1a', 
        title: 'Topic 1 is the first topic, id define topic number',
        contents: [
          {id: 0, player: 'QUIZ', src: 'quiz1', title: 'Quiz for test'},
        ]
      },
      {
        id: '2', 
        title: 'The second one, whatever name can be used',
        contents: [
          {id: 0, player: 'YOUTUBE', src: 'X6a9odk6b_c', title: 'Games of Thrones theme song: piano cover '},
          {id: 1, player: 'YOUTUBE', src: 'XQMnT9baoi8', title: 'Dragonborn is comming: piano cover'},
          {id: 3, player: 'YOUTUBE', src: 'dUNm721wTec', title: 'Age of agression'},
        ]
      },
      {
        id: '3', 
        title: 'Name should not too long',
        contents: [
          {id: 0, player: 'YOUTUBE', src: 'R9ZE97rnBqE', title: 'Nick and Dave Conversation'},
          {id: 1, player: 'YOUTUBE', src: 'r6bkETisayg', title: 'The last storyline'},
        ]
      }
    ]

    const content = {
      courseId,
      detail,
      data
    }
    
    contentDB.createContent({ uid, content }, (err, data) => {
      if (err) {
        throw new Error (err)
      }
      // setTimeout(() => {
      //   console.log('Created content by test user')
      //   contentDB.getContent({courseId}, (err, data) => {
      //     if (err) {
      //       throw new Error (err)
      //     }
      //     console.log(data)
      //   })
      // },1000)   
    })

  }

}

