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

    fluid.defaults("gpii.tests.schema.valid", {
        gradeNames: ["gpii.schema.component"],
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

    jqUnit.test("Testing the base gpii.schema.component grade.", function () {
        gpii.schema.component();
        jqUnit.assert("We should have been able to instantiate an instance of the base gpii.schema.component grade successfully.");
    });


    jqUnit.test("Testing valid component options.", function () {
        gpii.tests.schema.valid({ newBoolean: true });
        jqUnit.assert("We should have been able to instantiate our custom component with valid options.");
    });

    jqUnit.test("Testing invalid component options.", function () {
        jqUnit.expectFrameworkDiagnostic("An invalid component should fail to start up.", function () {
            gpii.tests.schema.valid({ newBoolean: "not valid" });
        }, ["schema"]);
    });

    fluid.defaults("gpii.tests.schema.required", {
        gradeNames: ["gpii.schema.component"],
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
            gpii.tests.schema.required();
        }, ["requiredField"]);
    });

    fluid.defaults("gpii.tests.schema.invalidSchema", {
        gradeNames: ["gpii.schema.component"],
        schema: "A string is completely inappropriate here."
    });

    jqUnit.test("Testing invalid GSS schema definitions.", function () {
        jqUnit.expectFrameworkDiagnostic("A component with an invalid schema should fail to start up.", function () {
            gpii.tests.schema.invalidSchema();
        }, ["Invalid GSS Schema"]);
    });
})(fluid_3_0_0, AJV, jqUnit);
