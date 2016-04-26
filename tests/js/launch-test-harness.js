// Launch the test harness as a standalone server to assist in browser debugging.
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("./lib/harness");

gpii.test.schema.harness({
    "expressPort" :   6904,
    "baseUrl":        "http://localhost:6904/"
});

// var harness = gpii.test.schema.harness({
//     "expressPort" :   6904,
//     "baseUrl":        "http://localhost:6904/"
// });
// require("gpii-express");
// fluid.require("%gpii-express/tests/js/lib/test-helpers.js");
// console.log(JSON.stringify(gpii.test.express.diagramAllRoutes(harness), null, 2));