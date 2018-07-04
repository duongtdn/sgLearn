"use strict"

/**
 * Setup Process
 *  - Set root
 *  - download (clone) source code from reposistories
 *  - create symlinks
 *  - install all dependency modules in each package 
 */


// project
//   .root(`${process.env.HOME}/work/`)
//   .download().then(() => console.log('\n\nSetup completed\n'))
//   // .install();

async function setup() {
  const Project = require('./project')

  const project = new Project();

  project.root(`${process.env.HOME}/work/`)

  await  project.download()  

  console.log('\n\nSetup completed\n')

}

setup()

console.log('\n\n* ----------------- * -------------------- *\n');


