"use strict"

const fs = require('fs')
const git = require('./git')
const npm = require('./npm')

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

  }

  root(dir) {
    this._rootDir = dir;    
    return this
  }

  download() {

    if (!this._dir) {
      throw new Error("Error: Directory structure is not found!");
    }    

    process.chdir(this._rootDir);

    this._downloadModules(this._dir);

    return this;

  }

  _downloadModules(path) {
    for (let name in path) {
      if (typeof path[name] === 'object') {
        this._createFolder(name)
        this._downloadModules(path[name])
      } else {
        this._cloneRepo(path[name])        
        this._modules.push(`${process.cwd()}/${name}`);
      }
    }
    process.chdir('../');    
  }

  _createFolder(name) {
    console.log('\nCreating folder ' + name)
    if (fs.existsSync(name)) {
      console.log(`${name} exist\n`);
      process.chdir(name);
      return this
    }
    fs.mkdirSync(name);
    process.chdir(name);
    return this
  }

  _cloneRepo(url) {    
    console.log('')
    git.cloneSync(url.split('+').pop());
  }

  createSymlink() {  
    console.log('');

    this._modules.forEach(module => {
        process.chdir(module);
        // clean package-lock.json if any
        if (fs.existsSync('package-lock.json')) {
          fs.unlinkSync('package-lock.json');
          console.log('Removed package-lock.json')
        }        
    })

    this._modules.forEach(module => {
      // recursively create symlink for all dependency
      this._recursiveCreateSymlink(this._getModuleName(module));
    })
  }

  _recursiveCreateSymlink(module) {    
    if (this._symlinks.indexOf(module) !== -1) {
      return
    }
    const dependencies = this._parseLocalDependency(this._getModuleInstallPath(module));
    if (dependencies.length > 0) {      
      dependencies.forEach(dep => {
        this._recursiveCreateSymlink(dep)        
      })      
      process.chdir(this._getModuleInstallPath(module))
      console.log(`Create symlink to local dependencies for ${module}`)
      dependencies.forEach(dep => {
        console.log(`   -> ${dep}`)
        npm.link(dep);        
      })      
      console.log(`Create global symlink for ${module}`)      
      npm.link();
      this._symlinks.push(module);
      console.log(`Install dependencies for ${module}`);
      npm.install();
    } else {    
      console.log(`Create global symlink for ${module}`)
      process.chdir(this._getModuleInstallPath(module))
      npm.link();
      this._symlinks.push(module);
      console.log(`Install dependencies for ${module}`);
      npm.install();       
    }      
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