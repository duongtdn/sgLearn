"use strict"

/**
 * Setup Process
 *  - Set root
 *  - download (clone) source code from reposistories
 *  - create symlinks
 *  - install all dependency modules in each package 
 */

const Project = require('./project')

const project = new Project();

project
  .root(`${process.env.HOME}/work/`)
  .download()
  .install();

console.log('\nSetup completed\n');


