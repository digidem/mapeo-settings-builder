import glob from 'glob'
import path from 'path'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export default function checkIcons (presets, iconDir) {
  var makiIconPath = path.dirname(require.resolve('maki/src/aerialway-12.svg'))
  var makiIcons = glob.sync('*-12.svg', { cwd: makiIconPath }).map(filename => {
    return filename.replace('-12.svg', '')
  })
  var iconNames = glob.sync('*.svg', { cwd: iconDir }).map(filename => {
    return filename.replace(/-\d+px\.svg$/, '')
  })
  var missing = []
  var undefinedIcons = []
  Object.keys(presets).forEach(key => {
    var icon = presets[key].icon
    if (!icon) return undefinedIcons.push(key)
    if (iconNames.indexOf(icon) < 0 && makiIcons.indexOf(icon) < 0) {
      missing.push('"' + icon + '" (preset: ' + key + ')')
    }
  })
  if (undefinedIcons.length) {
    throw new Error('No icon defined:\n- ' + undefinedIcons.join('\n- ') + '\n')
  }
  if (missing.length) {
    throw new Error('Missing icons:\n- ' + missing.join('\n- ') + '\n')
  }
}
