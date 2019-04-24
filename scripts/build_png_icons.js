var fs = require('fs')
var glob = require('glob')
var path = require('path')
var parallel = require('run-parallel-limit')
var { createConverter } = require('convert-svg-to-png')

var resizeSvg = require('./resize_svg')

const SIZES = {
  small: 15,
  medium: 30,
  large: 50
}
const SCALES = [1, 2, 3]

const outputs = []

Object.keys(SIZES)
  .forEach(size => SCALES.forEach(scale => outputs.push({ size, scale })))

module.exports = function buildPngIcons (dir, cb) {
  const svgFiles = glob.sync('*-100px.svg', { cwd: dir })
  if (!svgFiles || svgFiles.length === 0) return cb(null, {})

  const converter = createConverter()

  function createConvertTask (filepath) {
    return function (cb) {
      fs.readFile(filepath, function (err, buf) {
        if (err) return cb(err)
        resizeSvg(buf, 100, function (err, resizedSvg) {
          if (err) return cb(err)
          const id = path.basename(filepath).replace('-100px.svg', '')
          parallel(outputs.map(o => ({
            size: o.size,
            scale: o.scale,
            id: id,
            svg: resizedSvg
          })).map(o => cb2 => createPng(o, cb2)), 1, cb)
        })
      })
    }
  }

  function createPng ({ size, scale, svg, id }, cb) {
    console.log(`createPng ${id}-${size}@${scale}x.png`)
    converter.convert(svg, {
      height: SIZES[size],
      width: SIZES[size],
      scale: scale
    }).then(pngBuf => cb(null, {
      png: pngBuf,
      filename: `${id}-${size}@${scale}x.png`
    })).catch(cb)
  }

  parallel(svgFiles.map(function (file) {
    return createConvertTask(path.join(dir, file))
  }), 1, done)

  function done (err, results) {
    console.log(err)
    converter.destroy()
    if (err) return cb(err)
    const flattenedResults = []
    results.forEach(r => Array.prototype.push.apply(flattenedResults, r))
    cb(null, flattenedResults)
  }
}
