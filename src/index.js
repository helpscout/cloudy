#!/usr/bin/env node
'use strict';

const path = require('path')
const Rsync = require('rsync')
const chokidar = require('chokidar')
const gitIgnore = require('parse-gitignore')


/**
 * Cloudy config
 */
const config = {
  server: '',
  dest: '/var/www/hs-app/'
}


/**
 * Gets the full file path from a file.
 *
 * @param   {string} - filename
 * @returns {string}
 */
const getFilePath = filename => path.resolve(
  process.cwd(),
  filename
)


/**
 * Gets the file directory from a filename.
 *
 * @param   {string} - filename
 * @returns {string}
 */
const getFileDir = filename => path.dirname(filename)


/**
 * Creates the final remote destination to rsync to.
 *
 * @param   {string} - filedir
 * @returns {string}
 */
const makeSyncDest = (filedir = '/') => {
  const { server, dest } = config
  const dir = filedir === '.' ? '' : filedir
  return `${server}:${path.normalize(dest + dir + '/')}`
}


/**
 * Rsync a local file to the remote destination
 *
 * @param   {string} - filename
 * @returns {chokidar}
 */
const syncFile = (filename, event) => {
  const dir = getFileDir(filename)
  const file = getFilePath(filename)

  const rsync = new Rsync()
    .shell('ssh')
    .flags('av')
    .source(file)
    .destination(makeSyncDest(dir))

  // if (event === 'unlink') {
  //   rsync.option('delete')
  // }
  console.log(rsync.command())

  rsync.execute(function(error, code, cmd) {
    if (error) {
      return console.log(error)
    }
    console.log(cmd)
    const changeText = event === 'change' ? 'updated' : 'deleted'
    console.log(`☁️  Cloudy synced: ${filename} ${changeText}`)
  })
}


/**
 * Start the chokidar watcher
 *
 * @returns {chokidar}
 */
const start = () => {
  return chokidar.watch('.', {
    ignored: [
      '.git',
      '.git/**/*',
      'node_modules',
      'node_modules/**/*',
      ...gitIgnore('.gitignore')
    ]
  }).on('all', (event, filename) => {
    if (event === 'change') {
      syncFile(filename, event)
    }
    // if (event === 'unlink') {
    //   syncFile(filename, event)
    // }
  })
}


/**
 * Start Cloudy!
 */
console.log('')
console.log('☁️  Cloudy start!')
console.log('')

process.on('SIGINT', function() {
  console.log('')
  console.log('☁️  Cloudy off!')
  console.log('')
  process.exit(0)
})

start()
