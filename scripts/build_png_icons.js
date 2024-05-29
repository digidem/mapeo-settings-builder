import fs from 'fs'
import glob from 'glob'
import path from 'path'
import svgToImg from '@digidem/svg-to-img'
import { promisify } from 'util'

var readFile = promisify(fs.readFile)
import { default as resizeSvgCB } from './resize_svg.js'
const resizeSvg = promisify(resizeSvgCB)

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

export default function buildPngIcons (dir, timeout, cb) {
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
            height: SIZES[size] * scale,
            destroyBrowserTimeout: timeout
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
      cb(null, flattenedResults)
    })
    .catch(cb)
}
