/* eslint-env node */
// Launch the test harness as a standalone server to assist in browser debugging.
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

require("./node/lib/harness");

fluid.test.schema.harness({
    "expressPort" :   6904,
    "baseUrl":        "http://localhost:6904/"
});
