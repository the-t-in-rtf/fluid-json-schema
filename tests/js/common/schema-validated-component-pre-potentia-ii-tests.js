/*

    Test compatibility with "pre potentia ii" versions of Infusion, which don't have the "workflow" mechanism we would
    prefer to use.

 */
/* eslint-env browser */
/* eslint-disable no-redeclare */
/* globals require */
var fluid  = fluid  || {};
var Ajv    = Ajv    || {};
var jqUnit = jqUnit || {};
/* eslint-enable no-redeclare */

(function (fluid, Ajv, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/schemaValidatedComponent");
        require("./lib/check-potentia-grades");
    }

    fluid.registerNamespace("fluid.tests.schemaValidatedComponent.legacy");

    fluid.tests.schemaValidatedComponent.legacy.hasRegisterPotentia = function () {
        return false;
    };

    fluid.contextAware.makeChecks({
        "fluid.hasRegisterPotentia": "fluid.tests.schemaValidatedComponent.legacy.hasRegisterPotentia"
    });

    fluid.defaults("fluid.tests.schemaValidatedComponent.legacy.component", {
        gradeNames: ["fluid.schema.component"],
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
        var component = fluid.tests.schemaValidatedComponent.legacy.component({ mustHave: true });
        jqUnit.assert("We should have been able to instantiate our custom component with valid options.");

        fluid.test.schema.checkContextGrades(component, jqUnit);
    });

    jqUnit.test("Testing invalid component options.", function () {
        jqUnit.expectFrameworkDiagnostic("An invalid component should fail to start up.", function () {
            fluid.tests.schemaValidatedComponent.legacy.component({});
        }, ["schema"]);
    });

    // Reenable the proper "has potentia" check.
    fluid.contextAware.makeChecks({
        "fluid.hasRegisterPotentia": "fluid.schema.component.hasRegisterPotentia"
    });
})(fluid, Ajv, jqUnit);
