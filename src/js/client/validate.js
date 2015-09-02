/*

 A client-side wrapper for the validation component.  See `../common/validate.js` for full details.

 Unlike the server-side component, you are expected to either configure this with static schema content, or to load
 the required schema content.

 */
/* globals ZSchema */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.validator.client");

gpii.schema.validator.client.getValidator = function (that) {
    return new ZSchema(that.options.zSchemaOptions);
};

fluid.defaults("gpii.schema.validator.client", {
    gradeNames: ["gpii.schema.validator"],
    invokers: {
        "getValidator": {
            funcName: "gpii.schema.validator.client.getValidator",
            args:     ["{that}"]
        }
    }
});
