#!/usr/bin/env node

var mkdirp = require('mkdirp').sync
var path = require('path')
var fs = require('fs')

function verifyFileStruct(cb) {

	function checkExists(file) {
		fullPath = path.join(process.cwd(), file)
		fs.access(fullPath, fs.F_OK, function(err) {
			if (err) {
				console.error(file, "DOES NOT EXIST \nPlease provide this file or directory before building.")
				return err
			}
			console.log(file, "exists...")
			done()
		})
	}

	function done() {
		if (--toCheck == 0) {
			console.log("File structure is correct, beginning packaging...")
			cb()
		}
	}

	var files = ['categories', 'fields', 'imagery.json', 'presets', 'schema', 'sprites', 'region.css', 'defaults.json']
	var toCheck = files.length
	for (file of files) {
		checkExists(file)
	}
}


function build() {
	var buildFolder = path.join(process.cwd(), 'build')
	mkdirp(buildFolder)

	genSVGs = require("../scripts/build_svgs.js").genSVGs
	genSprites = require('../scripts/build_sprites.js').genSprites
	genPackage = require("../scripts/build.js").genPackage

	var svgInputDir = path.join(process.cwd(), 'sprites')
	var svgOutputDir = path.join(buildFolder, 'svgs')
	var spriteFile = path.join(buildFolder, 'icons')


	mkdirp(svgOutputDir)

	function syncGenSprites(err) {
		if (err) throw err
		console.log("Generating sprites from SVGs...")
		return genSprites(err, svgOutputDir, spriteFile, syncGenPackage)
	}

	function syncGenPackage(err) {
		if (err) throw err
		console.log("Packaging presets, translations, and sprite assets...")
		return genPackage(err, spriteFile, buildFolder)
	}
	console.log("Generating necessary SVG files for sprites...")
	genSVGs(svgInputDir, svgOutputDir, syncGenSprites)
}


verifyFileStruct(build)





