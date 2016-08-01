var spritezero = require('spritezero')
var fs = require('fs')
var queue = require('queue-async')
var path = require('path')
var stringify = require('json-stable-stringify')


exports.genSprites = function genSprites(err, input, spriteFile, cb) {

  if (err) return cb(err)
 
  function filepaths (dir) {
    return fs.readdirSync(dir)
      .filter(function (d) {
        return !d.match(/^\./)
      })
      .map(function (d) {
        return path.join(dir, d)
      })
  }

  var ratio = 1
  function loadFile (file, callback) {
    fs.readFile(file, function (err, res) {
      return callback(err, {
        svg: res,
        id: path.basename(file).replace('.svg', '')
      })
    })
  }

  function sortById (a, b) {
    return b.id < a.id
  }

  var q = queue(16)

  filepaths(input).forEach(function (file) {
    q.defer(loadFile, file)
  })

  q.awaitAll(function (err, buffers) {
    if (err) return cb(err)

    buffers.sort(sortById)
    var pending = 2
    function saveCSS (err, formattedLayout) {
      if (err) return cb(err)
      var icon = spriteFile.replace(/^.*(\\|\/|\:)/, '')
      var spriteCss = Object.keys(formattedLayout).reduce(function (p, s) {
        var d = formattedLayout[s]
        var css = `.${s} {
          background-image: url(${icon}.png);
          background-position: -${d.x}px -${d.y}px;
          width: ${d.width}px;
          height: ${d.height}px;
        }`
        return (p + css + '\n\n')
      }, '')
      fs.writeFile(spriteFile + '.css', spriteCss, function (err) {
          if (err) return cb(err)
          done()
        })
    }

    function saveImage (err, layout) {
      if (err) return cb(err)
      spritezero.generateImage(layout, function (err, image) {
        if (err) return cb(err)
        fs.writeFile(spriteFile + '.png', image, function (err) {
          if (err) return cb(err)
          done()
        })
      })
    }

    function done () {
      if (--pending == 0) {
        return cb(null)
      }
    }


    var genLayout = spritezero.generateLayout
    genLayout(buffers, ratio, true, saveCSS)
    genLayout(buffers, ratio, false, saveImage)
  })
}
