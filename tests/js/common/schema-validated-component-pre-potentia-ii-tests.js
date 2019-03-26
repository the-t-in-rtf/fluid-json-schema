/*

    Test compatibility with "pre potentia ii" versions of Infusion, which don't have the "workflow" mechanism we would
    prefer to use.

 */
/* eslint-env browser */
/* globals require */
var fluid_3_0_0 = fluid_3_0_0 || {};
var AJV         = AJV         || {};
var jqUnit      = jqUnit      || {};

(function (fluid_3_0_0, AJV, jqUnit) {
    "use strict";
    if (typeof require !== "undefined") {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/schemaValidatedComponent");
    }
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.tests.schemaValidatedComponent.legacy");

    gpii.tests.schemaValidatedComponent.legacy.hasRegisterPotentia = function () {
        return false;
    };

    fluid.contextAware.makeChecks({
        "fluid.hasRegisterPotentia": "gpii.tests.schemaValidatedComponent.legacy.hasRegisterPotentia"
    });

    fluid.defaults("gpii.tests.schemaValidatedComponent.legacy.component", {
        gradeNames: ["gpii.schema.component"],
        schema: {
            properties: {
                options: {
                    properties: {
                        mustHave: { required: true }
                    }
                }
            }
        }
    });

    jqUnit.module("Schema validated component legacy compatibility tests.");

    jqUnit.test("Testing valid component options.", function () {
        var component = gpii.tests.schemaValidatedComponent.legacy.component({ mustHave: true });
        jqUnit.assert("We should have been able to instantiate our custom component with valid options.");

        jqUnit.assertTrue("The resulting component should have the 'potentia ii' grade mixed in.", fluid.componentHasGrade(component, "gpii.schema.component.potentiaII"));
        jqUnit.assertFalse("The resulting component should not have the 'legacy' grade mixed in.", fluid.componentHasGrade(component, "gpii.schema.component.legacy"));
    });

    jqUnit.test("Testing invalid component options.", function () {
        jqUnit.expectFrameworkDiagnostic("An invalid component should fail to start up.", function () {
            gpii.tests.schemaValidatedComponent.legacy.component({});
        }, ["schema"]);
    });

    // Reenable the proper "has potentia" check.
    fluid.contextAware.makeChecks({
        "fluid.hasRegisterPotentia": "gpii.schema.component.hasRegisterPotentia"
    });
})(fluid_3_0_0, AJV, jqUnit);
