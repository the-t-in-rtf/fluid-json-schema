/* eslint-env node */
"use strict";
var fluid = require("infusion");

// We must pass the current `require` to `fluid.require`, as nyc's instrumentation is hooked into it.
fluid.require("%gpii-json-schema", require);

require("./js/common");
require("./js/node/");
