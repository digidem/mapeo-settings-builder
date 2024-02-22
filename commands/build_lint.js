var fs = require('fs')
var path = require('path')
var run = require('run-series')
var presetsBuilder = require('id-presets-builder')
var yazl = require('yazl')
var exists = require('fs-exists-sync')
var jsonschema = require('jsonschema')
var pump = require('pump')

var imagerySchema = require('../schema/imagery.json')
var buildSVGSprite = require('../scripts/build_svg_sprite')
var buildPNGSprite = require('../scripts/build_png_sprite')
var buildPNGIcons = require('../scripts/build_png_icons')
var buildTranslations = require('../scripts/build_translations')
var checkIcons = require('../scripts/check_icons')
var pkg = require('../package.json')
var log = require('../scripts/log')

module.exports = function ({ output, lang, timeout }, sourceDir, { lint } = { lint: false }) {
  var iconDir = path.join(sourceDir, 'icons')
  var messagesDir = path.join(sourceDir, 'messages')
  var imageryFile = path.join(sourceDir, 'imagery.json')
  var styleFile = path.join(sourceDir, 'style.css')
  var layersFile = path.join(sourceDir, 'layers.json')
  var metadataFile = path.join(sourceDir, 'metadata.json')
  var pak = {}
  try {
    pak = JSON.parse(fs.readFileSync(path.join(sourceDir, 'package.json'), 'utf8'))
  } catch (e) {
    log.error(
      'Could not read package.json from the presets you are trying to build'
    )
  }

  const start = Date.now()

  run(
    [
      wrapWithLog(
        'Built presets and categories',
        presetsBuilder.generatePresets.bind(null, sourceDir, {
          additionalProperties: true
        })
      ),
      wrapWithLog(
        'Generated svg sprite for iD',
        buildSVGSprite.bind(null, iconDir)
      ),
      wrapWithLog(
        'Generated png sprite for Mapbox',
        buildPNGSprite.bind(null, iconDir)
      ),
      wrapWithLog(
        'Generated png icons for Mapeo Mobile',
        buildPNGIcons.bind(null, iconDir, timeout)
      ),
      wrapWithLog(
        'Generated translations',
        buildTranslations.bind(null, messagesDir)
      )
    ],
    function (err, results) {
      if (err) return done(err)
      var presets = results[0]
      var svgSprite = results[1]
      var pngSprite = results[2].png
      var pngLayout = results[2].layout
      var pngIcons = results[3]
      var translations = results[4]

      var zip = new yazl.ZipFile()

      const safelyZipBuffer = (bufOrString, name) => {
        const buf = typeof bufOrString === 'string'
          ? Buffer.from(bufOrString)
          : bufOrString
        try{
          zip.addBuffer(buf, name)
        }catch(e){
          log.err(`error ziping file ${name}`)
        }
      }

      if (exists(imageryFile)) {
        try {
          var imagery = fs.readFileSync(imageryFile)
          var imageryObj = JSON.parse(imagery.toString())
        } catch (e) {
          done(e)
        }
        if (!validate(imageryFile, imageryObj, imagerySchema)) {
          return done(new Error(imageryFile + ': Imagery structure is invalid'))
        }
      }

      if (!translations) {
        translations = {}
        translations[lang] = {
          presets: presetsBuilder.generateTranslations(
            presets.categories,
            presets.fields,
            presets.presets
          )
        }
      }

      try {
        checkIcons(presets.presets, iconDir)
      } catch (e) {
        done(e)
      }

      var metadata = {}
      if (exists(metadataFile)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
        } catch (e) {
          log.error('Could not parse metadata.json file:', e.message)
          return
        }
      }

      if (typeof metadata.projectKey === 'string') {
        try {
          validateProjectKey(metadata.projectKey)
        } catch (e) {
          log.error(e.message)
          return
        }
      }

      if (lint) {
        return log(log.chalk.bold(log.symbols.ok + ' Presets are valid'))
      }

      safelyZipBuffer(stringify(presets), 'presets.json')
      safelyZipBuffer(stringify(translations), 'translations.json')
      if (svgSprite) {
        safelyZipBuffer(svgSprite, 'icons.svg')
      }
      if (pngSprite) {
        safelyZipBuffer(pngSprite, 'icons.png')
        safelyZipBuffer(JSON.stringify(pngLayout, null, 2), 'icons.json')
      }
      if (imagery) {
        safelyZipBuffer(stringify(imagery), 'imagery.json')
      }
      if (exists(styleFile)) {
        safelyZipBuffer(fs.readFileSync(styleFile), 'style.css')
      }
      if (exists(layersFile)) {
        safelyZipBuffer(fs.readFileSync(layersFile), 'layers.json')
      }
      metadata.name = metadata.name || pak.name
      metadata.version = metadata.version || pak.version

      if (metadata.syncServer) {
        try {
          const parsed = new URL(metadata.syncServer)
          if (parsed.protocol !== 'wss:') {
            if (parsed.protocol !== 'ws:') {
              log.error(`Error: syncServer was set to an invalid protocol: ${parsed.protocol}`)
              return
            } else {
              log.warn('syncServer protocol got set to `ws`, did you mean to use `wss` for a secure connection?')
            }
          }
        } catch (e) {
          log.error('Error parsing syncServer:', e.message)
        }
      }
      safelyZipBuffer(stringify(metadata), 'metadata.json')
      if (pngIcons) {
        pngIcons.forEach(icon => {
          safelyZipBuffer(icon.png, `icons/${icon.filename}`)
        })
      }
      safelyZipBuffer(pkg.version, 'VERSION')
      var outputStream = output ? fs.createWriteStream(output) : process.stdout
      zip.end()
      pump(zip.outputStream, outputStream, err => {
         if (err) log.error(`Error writing file ${output}`)
         else {
           log(
             `${log.chalk.bold(
               log.symbols.ok + ' Successfully created file'
             )} '${log.chalk.italic(output)}' ${log.chalk.gray(
               `(total ${Date.now() - start}ms)`
             )}`
           )
         }
       })
    }
  )
}

function wrapWithLog (msg, fn) {
  return cb => {
    const start = Date.now()
    fn((err, result) => {
      if (err) {
        log.error(err)
      } else {
        log(
          `${log.symbols.ok} ${msg} ${log.chalk.gray(
            `(${Date.now() - start}ms)`
          )}`
        )
      }
      cb(err, result)
    })
  }
}

function stringify (o) {
  return JSON.stringify(o, null, 4)
}

function done (err) {
  if (!err) return
  log.error(err.stack)
  process.exit(1)
}

function validate (filename, instance, schema) {
  var errors = jsonschema.validate(instance, schema).errors
  if (!errors.length) return true
  log.error(filename + ': ')
  errors.forEach(function (error) {
    if (error.property) {
      log.error(error.property + ' ' + error.message)
    } else {
      log.error(error)
    }
  })
  return false
}

function validateProjectKey (key) {
  if (typeof key !== 'string') {
    throw new Error('Invalid project key, it must be a string (in metadata.json this means it must be enclosed in quotes ""')
  }
  if (key.length !== 64) {
    throw new Error(`Invalid project key, the project key must be 64 characters long, your key is ${key.length} characters long`)
  }
  const regexp = /[^0-9a-f]/g
  const errors = []
  let match
  while ((match = regexp.exec(key)) !== null) {
    errors.push(`'${match[0]}' at position ${match.index}`)
  }
  if (errors.length) {
    throw new Error(`Invalid project key, the project key must be only use the numbers 0-9 and lowercase letters a-f
  Your project key includes these invalid characters:
  ${errors.join('\n  ')}`)
  }
  return true
}
