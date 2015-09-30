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
    var validator = new ZSchema(that.options.zSchemaOptions);

    // This is required on the client side to handle dependencies between schemas correctly.
    fluid.each(that.schemaContents, function (schemaContent) {
        var schemasValid = validator.validateSchema(schemaContent);
        if (!schemasValid) {
            fluid.fail(validator.getLastErrors());
        }
    });

    return validator;
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
