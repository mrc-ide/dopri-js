## Dormand–Prince method in JavaScript

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![build-and-test](https://github.com/mrc-ide/dopri-js/actions/workflows/ci.yml/badge.svg)](https://github.com/mrc-ide/dopri-js/actions/workflows/ci.yml)
[![codecov.io](https://codecov.io/github/mrc-ide/dopri-js/coverage.svg?branch=master)](https://codecov.io/github/mrc-ide/dopri-js?branch=master)

A simple adaptive ordinary differential equation (ODE) and delay differential equation (DDE) solver in TypeScript, based on the 5th order Dormand-Prince method.

## Licence

MIT © Imperial College of Science, Technology and Medicine

Please note that this project is released with a [Contributor Code of Conduct](CONDUCT.md). By participating in this project you agree to abide by its terms.

## Publishing to NPM

Automatically publish to [NPM](https://www.npmjs.com). Assuming a version number 1.0.0:

* Create a [release on github](https://github.com/mrc-ide/dopri-js/releases/new)
* Choose a tag -> Create a new tag: v1.0.0
* Use this version as the description
* Optionally describe the release
* Click "Publish release"
* This triggers the release workflow and the package will be available on NPM in a few minutes

Note: This package's name on NPM is `@reside-ic/dopri` not `dopri`.
