"use strict"

const Project = require('./project')

const project = new Project();

project
  .root(`${process.env.HOME}/work/`)
  .download()
  .createSymlink();

console.log('\nSetup completed\n');

/* parse project config */


/* clone all reposistories */


/* build dependency tree */


/* create npm symlink */


/* install all dependency modules in each package */

