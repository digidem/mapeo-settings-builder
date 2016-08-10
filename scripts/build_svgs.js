var fs = require('fs-extra')
var path = require('path')
var glob = require('glob')
var SVGO = require('svgo')
var svgo = new SVGO({
  plugins: [{removeTitle: true}, {removeViewBox: true}],
  pretty: true,
  js2svg: {
    pretty: true
  }
})

exports.genSVGs = function generateSVGs (inputDir, outputDir, cb) {
  glob('*.svg', {
    cwd: inputDir
  }, (err, files) => {
    if (err) {
      console.error('\nERROR: ' + err.message)
      process.exit(1)
    }
    var spriteNames = []
    var pending = files.length
    files.forEach(origFilename => {
      var newFilename = origFilename.toLowerCase()
        // .replace(/^ac_/, '')
        .replace(/\u00F1/g, 'n')
        // .replace(/-\d\d\.svg/, '.svg')
        .replace('px.svg', '.svg')
        // .replace(/^(animal-|animales-|ave-|pez-)/, 'fauna-')
        // .replace(/^(planta-)/, 'flora-')
        // .replace(/^(.*-.*)-([^\d]*-)/, '$1$2')
      fs.readFile(path.join(inputDir, origFilename), 'utf8', (err, str) => {
        if (err) {
          console.error('\nERROR: ' + err.message)
          process.exit(1)
        }
        var svg48px
        // var svg28px
        if (/24\.svg$/.test(newFilename)) {
          spriteNames.push(newFilename.replace(/-24\.svg$/, ''))
          if (newFilename === 'circle-24.svg') {
            // not sure why we're ignoring the circle
            svg48px = str
            // svg28px = str
          } else {
            // svg28px = str.replace(/^(<svg.*>)/, '$1\n<g transform="scale(1.1667)">')
            //   .replace(/(<\/svg>\n?)$/m, '</g>\n$1')
            //   .replace(/^(<svg.*width=)"24"/, '$1"28"')
            //   .replace(/^(<svg.*height=)"24"/, '$1"28"')
            //   .replace(/^(<svg.*)viewBox=".*"/, '$1')
            svg48px = str.replace(/^(<svg.*>)/, '$1\n<g transform="scale(2,2)">')
              .replace(/(<\/svg>\n?)$/m, '</g>\n$1')
              .replace(/^(<svg.*width=)"24"/, '$1"48"')
              .replace(/^(<svg.*height=)"24"/, '$1"48"')
              .replace(/^(<svg.*)viewBox=".*"/, '$1')
          }
          svgo.optimize(svg48px, result => {
            fs.writeFile(path.join(outputDir, newFilename.replace(/24\.svg$/, '48.svg')), result.data, done)
          })
        }
        svgo.optimize(str, result => {
          fs.writeFile(path.join(outputDir, newFilename), result.data, done)
        })
      })
    })
    function done (err) {
      if (err) return cb(err)
      if (--pending === 0) {
        // fs.writeFileSync(path.join(__dirname, '../sprites', 'names.json'), JSON.stringify(spriteNames))
        return cb(null)
      }
    }
  })
}
