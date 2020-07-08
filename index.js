/* eslint-env node */
"use strict";
var fluid = require("infusion");

// Expose this package's content so that relative paths can be resolved using `fluid.module.resolvePath`.
fluid.module.register("fluid-json-schema", __dirname, require);

// Require all of the server-side components at once.
require("./src/js/common/fss-metaschema");
require("./src/js/common/validator");
require("./src/js/common/schemaHolder");
require("./src/js/common/schemaValidatedComponent");
require("./src/js/common/schemaValidatedModelComponent");

require("./src/js/server/schemaValidationMiddleware");
require("./src/js/server/kettleValidation");
