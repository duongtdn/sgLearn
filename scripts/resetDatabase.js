"use strict"

require('dotenv').config()

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;

const userdb = require('./userdb')
const enrolldb = require('./enrolldb')
const contentdb = require('./contentdb')

console.log('\nReset Database\n')

userdb.use({host,port}).reset();
enrolldb.use({host,port}).reset();
contentdb.use({host,port}).reset();