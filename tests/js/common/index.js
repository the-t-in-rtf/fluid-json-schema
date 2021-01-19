/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("./metaschema-tests");
require("./orderedStringify-tests");
require("./schema-holder-tests");
require("./schema-validated-modelComponent-tests");
require("./schema-validated-component-tests");
require("./schema-validated-component-pre-potentia-ii-tests");
require("./schema-validated-infusion-options-component-tests");
require("./validator-global-component-tests");

// As the mechanisms for retrieving message bundles differ widely, each environment must define the standard namespaced
// message bundle used in the "common" static function tests.  This is a simple definition for Node.js.

fluid.require("%fluid-handlebars");
fluid.registerNamespace("fluid.tests.schema");

fluid.tests.schema.defaultMessageBundle = fluid.handlebars.i18n.deriveMessageBundle(false, fluid.handlebars.i18n.loadMessageBundles({
    validation: "%fluid-json-schema/src/messages"
}));

require("./validator-static-function-testDefs");
fluid.tests.schema.validator.staticFunctionTests();
