/* eslint-env node */
"use strict";
var fluid = require("infusion");

// Expose this package's content so that relative paths can be resolved using `fluid.module.resolvePath`.
fluid.module.register("gpii-json-schema", __dirname, require);

// Require all of the server-side components at once.
require("./src/js/common/gss-metaschema");
require("./src/js/common/validator");
require("./src/js/common/validation-errors");
require("./src/js/common/schemaValidatedComponent");
require("./src/js/common/schemaValidatedModelComponent");

require("./src/js/server/schemaValidationMiddleware");

