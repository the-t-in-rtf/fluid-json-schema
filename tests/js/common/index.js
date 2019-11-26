/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./metaschema-tests");
require("./orderedStringify-tests");
require("./schema-holder-tests");
require("./schema-validated-modelComponent-tests");
require("./schema-validated-component-tests");
require("./schema-validated-component-pre-potentia-ii-tests");
require("./validator-global-component-tests");

// As the mechanisms for retrieving message bundles differ widely, each environment must define the standard namespaced
// message bundle used in the "common" static function tests.  This is a simple definition for Node.js.

fluid.require("%gpii-handlebars");
fluid.registerNamespace("gpii.tests.schema");

gpii.tests.schema.defaultMessageBundle = gpii.handlebars.i18n.deriveMessageBundle(false, gpii.handlebars.i18n.loadMessageBundles({
    validation: "%gpii-json-schema/src/messages"
}));

require("./validator-static-function-testDefs");
gpii.tests.schema.validator.staticFunctionTests();
