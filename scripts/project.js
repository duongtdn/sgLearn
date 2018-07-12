"use strict"

const fs = require('fs')
const git = require('./git')
const npm = require('./npm')

const config = require('./config')

class Project {

  constructor(file) {
    
    /* parse config */
    const fp = fs.readFileSync(file || 'project.json');
    if (fp) {
      this._config = JSON.parse(fp);
      this._dir = this._config.directory;      
    } else {
      throw new Error("Error: Could not find project.json");
    }

    this._rootDir = './';
    this._modules = [];
    this._symlinks = [];
    this.__asyncTasks = [];

  }

  root(dir) {
    this._rootDir = dir;    
    return this
  }

  async download() {
    

    if (!this._dir) {
      throw new Error("Error: Directory structure is not found!");
    }    

    console.log('\nDownloading/Updating local packages from reposistories...\n');

    process.chdir(this._rootDir);

    await this._download(this._dir);

    console.log('\nDownload/Update completed\n')

    /* thenable return for compatible with async/await */
    return { 
      then(resolve, reject){
        resolve();
      } 
    }   

  }

  async _download(path) {
    this.__asyncTasks = [];
    this._downloadModules(path);
    await Promise.all(this.__asyncTasks);  
  }

  _downloadModules(path) {
    for (let name in path) {
      if (typeof path[name] === 'object') {
        this._createFolder(name)
        this._downloadModules(path[name])
      } else {
        console.log(`Updating ${name}...\n`)
        this.__asyncTasks.push(this._cloneRepo(path[name]));
        this._modules.push(`${process.cwd()}/${name}`);
      }
    }
    process.chdir('../');    
  }

  _createFolder(name) {    
    if (fs.existsSync(name)) {
      config.__verbose && console.log(`\n${name} exist`);
    } else {
      config.__verbose && console.log('Creating folder ' + name)
      fs.mkdirSync(name);
    }    
    process.chdir(name);
    return this
  }

  _cloneRepo(url) {        
    return git.clone(url.split('+').pop());
  }

  async install() {  
    console.log('');

    this._modules.forEach(module => {
        process.chdir(module);
        // clean package-lock.json if any
        if (fs.existsSync('package-lock.json')) {
          fs.unlinkSync('package-lock.json');
          config.__verbose && console.log('Removed package-lock.json')
        }        
    })

    this._modules.forEach(module => {
      // recursively create symlink for all dependency
      this._recursiveBuildSymlinkList(this._getModuleName(module));
    })

    await this._linkDependencies();

    this._createLocalSymlinkToProject()._installProjectDependencies();

  }

  _createLocalSymlinkToProject() {

    console.log('Linking local depedencies to the project');

    process.chdir(`${__dirname}/../`)

    const fp = fs.readFileSync('package.json');
    if (!fp) {
      throw new Error('missing package.json');
    }

    const pck = JSON.parse(fp)

    const deps = { ...pck.dependencies, ...pck.devDependencies }

    for (let module in deps) {
      console.log(` ---> Linking to local module: ${module}`)
      this._isLocalModules(module) && npm.linkSync(module);
    }

    console.log('Linked local depedencies to the project');

    return this;

  }

  _installProjectDependencies() {
    console.log('\nInstalling local depedencies to the project\n');
    process.chdir(`${__dirname}/../`)

    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
      config.__verbose && console.log('Removed package-lock.json')
    }

    npm.install();
    console.log('Installed depedencies to the project');
    return this;
  }

  _recursiveBuildSymlinkList(module) {    
    if (this._symlinks.indexOf(module) !== -1) {
      return
    }
        
    const dependencies = this._parseLocalDependency(this._getModuleInstallPath(module));

    if (dependencies.length > 0) {      
      dependencies.forEach(dep => {
        this._recursiveBuildSymlinkList(dep)        
      })                  
    }
    this._symlinks.push(module);
    return
  }

  async _linkDependencies() {
    for(let i = 0; i < this._symlinks.length; i++) {
      const module = this._symlinks[i]
      process.chdir(this._getModuleInstallPath(module))
      console.log(`Create Global Symlink to ${module}`)
      await this._linkLocalDependencies(module)
      npm.linkSync();
    }
    /* thenable return for compatible with async/await */
    return { 
      then(resolve, reject){
        resolve();
      } 
    }
  }

  _linkLocalDependencies(module) {
    const path = this._getModuleInstallPath(module);
    process.chdir(path);
    const dependencies = this._parseLocalDependency(path);
    const __tasks = [];
    dependencies.forEach(dep => {
      console.log(` ---> Linking to local module: ${dep}`)
      __tasks.push(npm.link(dep)) 
    })
    return Promise.all(__tasks)
  }

  _getModuleInstallPath(name) {
    for (let i = 0; i < this._modules.length; i++) {
      const module = this._modules[i];
      if(this._getModuleName(module) === name) {        
        return module
      }
    }
  }

  _parseLocalDependency(module) {
    const fp = fs.readFileSync(`${module}/package.json`);
    if (!fp) {
      throw new Error(`Error: Could not find package.json at ${module}/`);
    }

    const config = JSON.parse(fp);

    const dependencies = [];    

    if (config && config.dependencies) {
      for (let dep in config.dependencies) {
        this._isLocalModules(dep) && dependencies.push(dep);
      }
    }

    if (config && config.devDependencies) {
      for (let dep in config.devDependencies) {
        this._isLocalModules(dep) && dependencies.push(dep);
      }
    }
    return dependencies;
  }

  _isLocalModules(module) {
    return this._modules.some(_module => {            
      return this._getModuleName(_module) === module
    })
  }

  _getModuleName(module) {
    const cwd = process.cwd();
    process.chdir(module)
    const fp = fs.readFileSync('package.json');
    if (!fp) {
      throw new Error(`Error: Could not find package.json at ${module}/`);
    }
    const config = JSON.parse(fp);
    process.chdir(cwd);
    return config.name; 
  }

  _findDir(dir) {    
    if (dir === 'directory') {
      return this._dir;
    }
    return this._recursiveFindDir(dir, this._dir)
  }

  _recursiveFindDir(dir, path) {    

    if (typeof path !== 'object') {
      return false
    }

    if (Object.keys(path).indexOf(dir) !== -1) {
      return path[dir];
    }

    for (let name in path) {
      const found = this._recursiveFindDir(dir, path[name]);
      if (found) {
        return found;
      }
    }

  }

}

module.exports = Project