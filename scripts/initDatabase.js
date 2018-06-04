"use strict"

require('dotenv').config()

const host = 'http://localhost';
const port = 3001;

const userdb = require('./userdb')
const enrolldb = require('./enrolldb')
const contentdb = require('./contentdb')

console.log('\nReset Database\n')

userdb.use({host,port}).new();
enrolldb.use({host,port}).new();
contentdb.use({host,port}).new();