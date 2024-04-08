import spritezero from '@mapbox/spritezero'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import parallel from 'run-parallel'

import resizeSvg from './resize_svg.js'

function createResizeTask (filepath) {
  return function (cb) {
    fs.readFile(filepath, function (err, buf) {
      if (err) return cb(err)
      resizeSvg(buf, 100, function (err, resizedSvg) {
        if (err) {
          return cb(
            new Error('Error trying to parse ' + filepath + '\n' + err.message)
          )
        }
        cb(null, {
          svg: Buffer.from(resizedSvg),
          id: path.basename(filepath).replace('.svg', '')
        })
      })
    })
  }
}

export default function buildPNGSprite (dir, cb) {
  const svgFiles = glob.sync('*-100px.svg', { cwd: dir })
  if (!svgFiles || svgFiles.length === 0) return cb(null, {})

  parallel(
    svgFiles.map(function (file) {
      return createResizeTask(path.join(dir, file))
    }),
    done
  )

  function done (err, imgs) {
    if (err) return cb(err)
    var pending = 2
    var errs = []
    var png
    var layout

    // Pass `true` in the layout parameter to generate a data layout
    // suitable for exporting to a JSON sprite manifest file.
    spritezero.generateLayout(
      { imgs: imgs, pixelRatio: 1, format: true },
      function (err, dataLayout) {
        layout = dataLayout
        done(err)
      }
    )

    // Pass `false` in the layout parameter to generate an image layout
    // suitable for exporting to a PNG sprite image file.
    spritezero.generateLayout(
      { imgs: imgs, pixelRatio: 1, format: false },
      function (err, imageLayout) {
        if (err) return done(err)
        spritezero.generateImage(imageLayout, function (err, image) {
          png = image
          done(err)
        })
      }
    )

    function done (err) {
      if (err) errs.push(err)
      if (--pending > 0) return
      if (errs.length) console.error('errors', errs)
      cb(errs[0], { png: png, layout: layout })
    }
  }
}
