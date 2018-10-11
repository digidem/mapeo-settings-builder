var spritezero = require('@mapbox/spritezero')
var fs = require('fs')
var glob = require('glob')
var path = require('path');

var SIZES = [1]

module.exports = function buildPNGSprite (dir, cb) {
  SIZES.forEach(function (pxRatio) {
    var svgs = glob.sync('*-100px.svg', {cwd: dir})
      .map(function (f) {
        return {
          svg: fs.readFileSync(path.join(dir, f)),
          id: path.basename(f).replace('.svg', '')
        }
      })

    var pending = 2
    var errs = []
    var png
    var layout

    // Pass `true` in the layout parameter to generate a data layout
    // suitable for exporting to a JSON sprite manifest file.
    spritezero.generateLayout({ imgs: svgs, pixelRatio: pxRatio, format: true }, function (err, dataLayout) {
      layout = dataLayout
      done(err)
    })

      // Pass `false` in the layout parameter to generate an image layout
      // suitable for exporting to a PNG sprite image file.
    spritezero.generateLayout({ imgs: svgs, pixelRatio: pxRatio, format: false }, function (err, imageLayout) {
      if (err) return done(err)
      spritezero.generateImage(imageLayout, function (err, image) {
        png = image
        done(err)
      })
    })

    function done (err) {
      if (err) errs.push(err)
      if (--pending > 0) return
      console.log('errors', errs, pending)
      cb(errs[0], {png: png, layout: layout})
    }
  })
}
