var spritezero = require('spritezero')
var glob = require('glob')
var fs = require('fs')
var path = require('path')
var run = require('run-parallel')
var slug = require('slug')
slug.defaults.mode = 'rfc3986'

var PIXEL_RATIO = 1

function loadSvg (file, cb) {
  fs.readFile(file, function (err, buf) {
    cb(err, {
      svg: buf,
      id: slug(path.basename(file, '.svg'))
    })
  })
}

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
  var tasks = filepaths.map(function (filepath) {
    return loadSvg.bind(null, path.join(dir, filepath))
  })

  run(tasks, function (err, imgs) {
    if (err) return cb(err)
    generateCss(imgs, function (err, css) {
      if (err) return cb(err)
      generatePng(imgs, function (err, png) {
        if (err) return cb(err)
        cb(null, {
          css: css,
          png: png
        })
      })
    })
  })
}

function generateCss (imgs, cb) {
  spritezero.generateLayout(imgs, PIXEL_RATIO, true, function (err, layout) {
    if (err) return cb(err)
    var css = ''
    for (var id in layout) {
      // NB: Do we need to have option to configure sprite name?
      css += '.' + id + ' {\n' +
        '  background-image: url(icons.png);\n' +
        '  background-position: -' + layout[id].x + 'px -' + layout[id].y + 'px;\n' +
        '  width: ' + layout[id].width + 'px;\n' +
        '  height: ' + layout[id].height + 'px;\n' +
        '}\n\n'
    }
    cb(null, css)
  })
}

function generatePng (imgs, cb) {
  spritezero.generateLayout(imgs, PIXEL_RATIO, false, function (err, layout) {
    if (err) return cb(err)
    spritezero.generateImage(layout, cb)
  })
}
