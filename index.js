"use strict";
var fluid = require("infusion");

// Expose this package's content so that relative paths can be resolved using `fluid.module.resolvePath`.
fluid.module.register("gpii-json-schema", __dirname, require);

// Require all of the server-side components at once.
require("./src/js/common/evolveErrors");
require("./src/js/common/hasRequiredOptions");
require("./src/js/common/pointers");
require("./src/js/common/validator");
require("./src/js/server/validator");
require("./src/js/server/parser");
require("./src/js/server/schemaInlineRouter");
require("./src/js/server/schemaLinkMiddleware");
require("./src/js/server/schemaValidationMiddleware");

