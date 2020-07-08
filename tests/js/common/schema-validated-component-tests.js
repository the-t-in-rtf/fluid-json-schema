/* eslint-env browser */
/* globals require */
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

    fluid.defaults("fluid.tests.schema.valid", {
        gradeNames: ["fluid.schema.component"],
        schema: {
            properties: {
                options: {
                    properties: {
                        newBoolean: { type: "boolean" }
                    }
                }
            }
        }
    });

    jqUnit.module("Schema validated component tests.");

    jqUnit.test("Testing the base fluid.schema.component grade.", function () {
        fluid.schema.component();
        jqUnit.assert("We should have been able to instantiate an instance of the base fluid.schema.component grade successfully.");
    });


    jqUnit.test("Testing valid component options.", function () {
        var component = fluid.tests.schema.valid({ newBoolean: true });
        jqUnit.assert("We should have been able to instantiate our custom component with valid options.");

        fluid.test.schema.checkContextGrades(component, jqUnit);
    });

    jqUnit.test("Testing invalid component options.", function () {
        jqUnit.expectFrameworkDiagnostic("An invalid component should fail to start up.", function () {
            fluid.tests.schema.valid({ newBoolean: "not valid" });
        }, ["schema"]);
    });

    fluid.defaults("fluid.tests.schema.required", {
        gradeNames: ["fluid.schema.component"],
        schema: {
            properties: {
                options: {
                    properties: {
                        requiredField: { type: "string", required: true }
                    }
                }
            }
        }
    });

    jqUnit.test("Testing required fields.", function () {
        jqUnit.expectFrameworkDiagnostic("A component that is missing a required field should fail to start up.", function () {
            fluid.tests.schema.required();
        }, ["requiredField"]);
    });

    fluid.defaults("fluid.tests.schema.invalidSchema", {
        gradeNames: ["fluid.schema.component"],
        schema: "A string is completely inappropriate here."
    });

    jqUnit.test("Testing invalid FSS schema definitions.", function () {
        jqUnit.expectFrameworkDiagnostic("A component with an invalid schema should fail to start up.", function () {
            fluid.tests.schema.invalidSchema();
        }, ["Invalid FSS Schema"]);
    });
})(fluid, Ajv, jqUnit);
