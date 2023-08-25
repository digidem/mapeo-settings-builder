# Mapeo Settings Builder

[![npm version][1]][2]
[![js-standard-style][3]][4]

[1]: https://img.shields.io/npm/v/mapeo-settings-builder.svg
[2]: https://www.npmjs.com/package/mapeo-settings-builder
[3]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[4]: http://standardjs.com/

> Build settings file for [Mapeo Desktop](https://github.com/digidem/mapeo-desktop)

When run in a folder of configuration, icon files and imagery definitions will create a single settings tarball which can be imported into [Mapeo Desktop](https://github.com/digidem/mapeo-desktop) to configure the application for a particular use-case.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Install

```
npm install --global mapeo-settings-builder
```

## Usage

```sh
# Lint settings
mapeo-settings lint

# Build settings tar file and output to stdout
mapeo-settings build {OPTIONS}

# Generate a project key
mapeo-settings generate-key
```

Mapeo Presets Builder expects the following file structure in the current directory:

```
├── categories
│   ├── a_category.json
│   ├── other_category.json
│   └── ...
├── fields
│   ├── a_field.json
│   ├── other_field.json
│   └── ...
├── presets
│   ├── preset_category
│   │   ├── a_preset.json
│   │   ├── other_preset.json
│   │   └── ...
│   ├── other_preset_category
│   │   ├── a_preset.json
│   │   ├── other_preset.json
│   │   └── ...
│   ├── uncategorized_preset.json
│   ├── other_uncategorized_preset.json
│   └── ...
├── icons
│   ├── a_icon.svg
│   ├── other_icon.svg
│   └── ...
├── defaults.json
├── imagery.json
├── metadata.json
└── style.css
```

Where:

- `imagery.json` is an object that should follow the structure defined by [editor-layer-index](https://github.com/osmlab/editor-layer-index/blob/gh-pages/schema.json)
- `style.css` is custom css to override iD css.
- `icons` is a folder of svg images to build a sprite for preset icons
- `categories`, `fields`, `presets`, `defaults.json` see [iD presets](https://github.com/openstreetmap/iD/tree/master/data/presets)
- `metadata.json` contains optional properties:
  - `projectKey` is a 32 byte (256-bit) random number encoded as a `hex` string (numbers 0-9 and lowercase letters a-f)
  - `name` is a human-readable name of these presets (written from `package.json` if it does not already exist)
  - `version` is the version number of the presets (written from `package.json` if it does not already exist)
  - `syncServer` is the URL of a mapeo-web server to sync to. (written from `package.json` if it does not already exist). For the Digital Democracy server this should be `wss://cloud.mapeo.app`, but the project key will need to be enabled on the server first.

### Options

- `-l, --lang=<langCode>` - the base language of the settings, defaults to `en`.
- `-o, --output=<filename>` - write the settings tarball to this file, if unspecified prints to stdout.
- `-t, --timeout=<number>` - timeout limit (in milliseconds) for icon generation process.
- `-p, --presets <path>` - custom presets folder path, which must include presets and fields folders inside

## Contribute

PRs accepted.

Small note: If editing the Readme, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © Digital Democracy
