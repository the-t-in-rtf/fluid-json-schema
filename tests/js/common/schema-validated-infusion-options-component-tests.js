/* eslint-env browser */
/* globals require */
/* eslint-disable-next-line no-redeclare */
var fluid  = fluid  || {};
var Ajv    = Ajv    || {};
var jqUnit = jqUnit || {};

(function (fluid, Ajv, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/schemaValidatedComponent");
        require("./lib/check-potentia-grades");
    }
    var testDefs = {
        nothingIsFine: {
            message: "An infusionOptionsValidatingComponent instance with no options should be valid.",
            options: {}
        },
        thisIstModelListener: {
            message: "A this-ist model listener should be fine.",
            options: {
                gradeNames: ["fluid.modelComponent"],
                model: {
                    foo: true
                },
                modelListeners: {
                    this: "{that}",
                    method: "click"
                }
            }
        }
    };
    fluid.each(testDefs, function (testDef) {
        jqUnit.test(testDef.message, function () {
            var toInvoke = function () { fluid.schema.infusionOptionsValidatingComponent(testDef.options); };
            if (testDef.shouldFail) {
                jqUnit.expectFrameworkDiagnostic("There should have been an error instantiating the component.", toInvoke, ["Component does not match its own schema, aborting component creation"]);
            }
            else {
                try {
                    toInvoke();
                    jqUnit.assert("The component should have be created.");
                }
                catch (error) {
                    jqUnit.fail("The component should have been created but was not.");
                }
            }
        });
    });
})(fluid, Ajv, jqUnit);
