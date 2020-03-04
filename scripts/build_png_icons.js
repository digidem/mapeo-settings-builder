var fs = require('fs')
var glob = require('glob')
var path = require('path')
var svgToImg = require('svg-to-img')
var { promisify } = require('util')

var readFile = promisify(fs.readFile)
var resizeSvg = promisify(require('./resize_svg'))

const SIZES = {
  small: 15,
  medium: 30,
  large: 50
}
const SCALES = [1, 2, 3]

const outputs = []

Object.keys(SIZES).forEach(size =>
  SCALES.forEach(scale => outputs.push({ size, scale }))
)

module.exports = function buildPngIcons (dir, cb) {
  const start = Date.now()
  const svgFiles = glob.sync('*-100px.svg', { cwd: dir })
  if (!svgFiles || svgFiles.length === 0) return cb(null, {})

  Promise.all(
    svgFiles.map(async file => {
      var filepath = path.join(dir, file)
      var buf = await readFile(filepath)
      var resizedSvg = await resizeSvg(buf, 100)
      var id = path.basename(filepath).replace('-100px.svg', '')
      return Promise.all(
        outputs.map(async ({ size, scale }) => {
          var png = await svgToImg.from(resizedSvg).toPng({
            width: SIZES[size] * scale,
            height: SIZES[size] * scale
          })
          var filename = `${id}-${size}@${scale}x.png`
          return { png, filename }
        })
      )
    })
  )
    .then(results => {
      const flattenedResults = []
      results.forEach(r => Array.prototype.push.apply(flattenedResults, r))
      console.log(
        `Converted ${flattenedResults.length} icons in ${Date.now() - start}ms`
      )
      cb(null, flattenedResults)
    })
    .catch(cb)
}
