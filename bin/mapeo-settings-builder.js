#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var run = require('run-parallel')
var presetsBuilder = require('id-presets-builder')
var tar = require('tar-stream')
var exists = require('fs-exists-sync')
var jsonschema = require('jsonschema')
var imagerySchema = require('../schema/imagery.json')

var argv = require('minimist')(process.argv.slice(2), {
  default: {
    lang: 'en'
  },
  alias: {
    l: 'lang',
    o: 'output'
  }
})
var cmd = argv._[0] || 'build'

var generateSprite = require('../scripts/build_sprite')
var checkIcons = require('../scripts/check_icons')

var VALID_COMMANDS = ['build', 'lint']

if (VALID_COMMANDS.indexOf(cmd) < 0) {
  console.error('Unknown command %s', cmd)
  process.exit(1)
}

var cwd = process.cwd()
var iconDir = path.join(cwd, 'icons')
var imageryFile = path.join(cwd, 'imagery.json')
var styleFile = path.join(cwd, 'style.css')
var layersFile = path.join(cwd, 'layers.json')

var opts = {
  additionalProperties: true
}

run([
  presetsBuilder.generatePresets.bind(null, cwd, opts),
  generateSprite.bind(null, iconDir)
], function (err, results) {
  if (err) return done(err)
  var presets = results[0]
  var sprite = results[1]
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

  var translationsLocale = presetsBuilder.generateTranslations(
    presets.categories,
    presets.fields,
    presets.presets
  )
  var translations = {}
  translations[argv.lang] = {presets: translationsLocale}

  try {
    checkIcons(presets.presets, iconDir)
  } catch (e) {
    done(e)
  }

  if (cmd === 'lint') return console.log('Presets are valid')

  var pack = tar.pack()
  pack.on('error', done)
  pack.entry({ name: 'presets.json' }, stringify(presets))
  pack.entry({ name: 'translations.json' }, stringify(translations))
  if (sprite) {
    pack.entry({ name: 'icons.svg' }, sprite)
  }
  if (imagery) {
    pack.entry({ name: 'imagery.json' }, imagery)
  }
  if (exists(styleFile)) {
    pack.entry({ name: 'style.css' }, fs.readFileSync(styleFile))
  }
  if (exists(layersFile)) {
    pack.entry({ name: 'layers.json' }, fs.readFileSync(layersFile))
  }
  pack.finalize()
  var outputStream = argv.o ? fs.createWriteStream(argv.o) : process.stdout
  pack.pipe(outputStream)
})

function stringify (o) {
  return JSON.stringify(o, null, 4)
}

function done (err) {
  if (!err) return
  console.error(err.stack)
  process.exit(1)
}

function validate (filename, instance, schema) {
  var errors = jsonschema.validate(instance, schema).errors
  if (!errors.length) return true
  console.error(filename + ': ')
  errors.forEach(function (error) {
    if (error.property) {
      console.error(error.property + ' ' + error.message)
    } else {
      console.error(error)
    }
  })
  return false
}
