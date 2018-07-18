/**
 * Sync Process
 *  - Set root
 *  - sync (clone) source code from reposistories
 */

(async function setup() {
  "use strict"
  const Project = require('./project')

  const project = new Project();

  project.root(`${process.env.HOME}/work/`)

  await  project.download()  

  console.log('\n\nSync completed\n')

})();


