"use strict"

const fs = require('fs')
const git = require('./git')

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
    const repo = url.split('+').pop();
    console.log('Cloning ' + repo)
    git.cloneSync(repo)
  }

  createSymlink() {  
    console.log('');
    this._createGlobalSymlinksForModules()._linkDependency();
  }

  _createGlobalSymlinksForModules() {
    this._modules.forEach(module => {
      process.chdir(module);
      console.log(`Creating symlink for ${module.split('/').pop()}`)
    })    
    return this;
  }

  _linkDependency() {
    this._modules.forEach(module => {
      process.chdir(module);
      console.log(`\nLinking local dependency for module ${module.split('/').pop()}`)
      const dependencies =  this._parseDependency();      
      let _noLink = true;
      dependencies.forEach(dep => {
        if (this._isLinkingModule(dep)) {
          _noLink = false;
          console.log(`   -> Linking ${dep} to module ${module.split('/').pop()}`)
        }
      })
      if (_noLink) {
        console.log('No local dependency')
      }
    })
    return this;
  }

  _parseDependency() {
    const fp = fs.readFileSync('package.json');
    if (!fp) {
      throw new Error("Error: Could not find package.json");
    }

    const config = JSON.parse(fp);

    const dependencies = [];

    if (config && config.dependencies) {
      for (let dep in config.dependencies) {
        dependencies.push(dep);
      }
    }

    if (config && config.devDependencies) {
      for (let dep in config.devDependencies) {
        dependencies.push(dep);
      }
    }

    return dependencies;
  }

  _isLinkingModule(dep) {
    return this._modules.some(module => {      
      return module.split('/').pop() === dep
    })
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