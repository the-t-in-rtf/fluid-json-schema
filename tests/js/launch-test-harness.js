/* eslint-env node */
// Launch the test harness as a standalone server to assist in browser debugging.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("./lib/harness");

gpii.test.schema.harness({
    "expressPort" :   6904,
    "baseUrl":        "http://localhost:6904/"
});
