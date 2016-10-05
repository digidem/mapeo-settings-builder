var glob = require('glob')

module.exports = function checkIcons(presets, iconDir) {
  var iconNames = glob.sync('*.svg', {cwd: iconDir}).map(filename => {
    return filename.replace(/-\d+px\.svg$/, '')
  })
  var missing = []
  var undefinedIcons = []
  Object.keys(presets).forEach(key => {
    var icon = presets[key].icon
    if (!icon) return undefinedIcons.push(key)
    if (iconNames.indexOf(icon) < 0) missing.push('"' + icon + '" (preset: ' + key + ')')
  })
  if (undefinedIcons.length) {
    console.warn('Warning: No icon defined:\n- ' + undefinedIcons.join('\n- ') + '\n')
  }
  if (missing.length) {
    throw new Error('Missing icons:\n- ' + missing.join('\n- ') + '\n')
  }
}
