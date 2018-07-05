/**
 * Setup Process
 *  - Set root
 *  - download (clone) source code from reposistories
 *  - create symlinks
 *  - install all dependency modules in each package 
 */

(async function setup() {
  "use strict"
  const Project = require('./project')

  const project = new Project();

  project.root(`${process.env.HOME}/work/`)

  await  project.download()  

  await project.install()

  console.log('\n\nSetup completed\n')

})();


