var SVGSpriter = require('svg-sprite')
var glob = require('glob')
var fs = require('fs')
var path = require('path')
var run = require('run-parallel')

/**
 * Searches `dir` for svg files and returns a css file and png sprite.
 * @param {string}   dir Directory to search for svgs
 * @param {Function} cb  cb(error, {css: <string>, png: <buffer>})
 */
module.exports = function generateSprite (dir, cb) {
  var filepaths = glob.sync('*.svg', {cwd: dir})
  if (!filepaths.length) {
    console.warn('Warning: no icons found in folder %s', dir)
    return cb()
  }

  var spriter = new SVGSpriter({
    mode: {symbol: true},
    shape: {id: {generator: idGenerator}}
  })
  var tasks = filepaths.map(function (filepath) {
    filepath = path.join(dir, filepath)
    return function (cb) {
      fs.readFile(filepath, 'utf8', function (err, data) {
        if (err) return cb(err)
        spriter.add(filepath, path.basename(filepath), data)
        cb()
      })
    }
  })

  run(tasks, function (err, imgs) {
    if (err) return cb(err)
    spriter.compile(function (err, result) {
      if (err) return cb(err)
      cb(null, result.symbol.sprite.contents)
    })
  })
}

function idGenerator (name) {
  return name
    .replace(/\.svg$/, '')
    .replace(/-24px$/, '-12')
    .replace(/-100px$/, '')
}
