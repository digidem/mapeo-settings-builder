import flat from 'flat'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import once from 'once'

export default function buildTranslations (dir, cb) {
  cb = once(cb)
  glob('*.json', { cwd: dir }, (err, matches) => {
    if (err) return cb(err)
    if (!matches.length) return cb()

    var translations = {}
    var pending = matches.length
    matches.forEach(filename => {
      fs.readFile(path.join(dir, filename), 'utf8', (err, data) => {
        if (err) return cb(err)
        var langCode = filename.replace(/\.json$/, '')
        try {
          translations[langCode] = convertMessagesToTranslations(JSON.parse(data))
          done()
        } catch (err) {
          cb(new Error('Error parsing messages file: ' + filename))
        }
      })
    })

    function done () {
      if (--pending) return
      cb(null, translations)
    }
  })
}

/**
 * @param {{ [messageId: string]: { description: string, message: string } } } messages
 * @returns {{
 *   fields: {
 *     [fieldId: string]: {
 *       label: string,
 *       placeholder?: string,
 *       helperText?: string,
 *       options?: { [value: string]: string }
 *     }
 *   },
 *   presets: {
 *     [presetId: string]: {
 *       name: string,
 *       terms: string
 *     }
 *   },
 *   categories: {
 *     [categoryId: string]: {
 *       name: string
 *     }
 *   }
 * }}
 */
function convertMessagesToTranslations (messages) {
  const messagesFlat = {}
  // Transform messages into an object { [messageId]: message }
  Object.keys(messages).forEach(messageId => {
    messagesFlat[messageId] = messages[messageId].message
  })
  // Turn messages into a nested object such that iD Editor will understand it
  const translations = flat.unflatten(messagesFlat, { object: true })

  translations.categories = translations.categories || {}
  return translations
}
