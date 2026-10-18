// @firebase/util loads optional defaults written by `postinstall.mjs`; Jest cannot parse .mjs and the defaults are not needed in tests.
module.exports = { getDefaultsFromPostinstall: () => undefined };
