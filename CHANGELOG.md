# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.11.0](https://github.com/digidem/mapeo-settings-builder/compare/v2.10.0...v2.11.0) (2020-03-04)


### Features

* Improve logging ([f24ffa6](https://github.com/digidem/mapeo-settings-builder/commit/f24ffa6d18130f55d928beb1597bd838abecff4a))

## [2.10.0](https://github.com/digidem/mapeo-settings-builder/compare/v2.9.0...v2.10.0) (2020-03-04)


### Features

* 🚀 Speed up sprite generation 40x ([6b43363](https://github.com/digidem/mapeo-settings-builder/commit/6b433637440cf78daa6b8d442c9fde0d3a7850ef))
* Save settings name and version to metadata ([386da73](https://github.com/digidem/mapeo-settings-builder/commit/386da73af447d58c1c403af38bce3c8a5260e440))

## [2.9.0](https://github.com/digidem/mapeo-settings-builder/compare/v2.8.0...v2.9.0) (2019-11-12)


### Features

* Add select_multiple support ([4874d0f](https://github.com/digidem/mapeo-settings-builder/commit/4874d0f13297f849fb3ae53c2453ae439efa34c4))

## [2.6.0] - 2019-03-15
### Added
- Include version in settings tarball as `VERSION` file

## [2.5.0] - 2019-03-15
### Added
- Export PNG sprites @100px

## [2.4.0] - 2017-10-17
### Changed
- Ignore missing icons if the names match a maki icon used by iD Editor.

## [2.3.0] - 2016-10-06
### Added
- Include a metadata.json file in settings package that defines the user's
  dataset preference for synchronization.

## [2.2.0] - 2016-10-06
### Added
- Include a layers.json file in settings package that defines layers for vector tiles.

## [2.1.0] - 2016-10-05
### Changed
- Check icons referenced by presets exist in icons folder, if not throw error
- Allow presets to have additional properties not defined in the schema

## [2.0.0] - 2016-08-17
### Added
- Validate schema of `imagery.json`

### Changed
- Build SVG instead of PNG sprites

## 1.0.0 - 2016-08-16

Initial release

[2.1.0]: https://github.com/digidem/mapeo-settings-builder/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/digidem/mapeo-settings-builder/compare/v1.0.0...v2.0.0
