"use strict"

require('dotenv').config()

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;

const userdb = require('./userdb')
const enrolldb = require('./enrolldb')
const contentdb = require('./contentdb')

console.log('\nInit Database\n')

userdb.use({host,port}).new();
enrolldb.use({host,port}).new();
contentdb.use({host,port}).new();