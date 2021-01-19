/* eslint-env browser */
/* eslint-disable no-redeclare */
/* globals jqUnit, require */
var fluid  = fluid  || {};
var jqUnit = jqUnit || {};
/* eslint-enable no-redeclare */

(function (fluid, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/orderedStringify");
        require("./lib/test-payloads");
    }

    jqUnit.module("Testing \"ordered stringify\" functions.");

    jqUnit.test("Testing `fluid.schema.stringify` with various types of data.", function () {
        var testDefs = {
            rootNonObjects: {
                message: "We should be able to handle root non-objects:",
                inputs: { boolean: true, string: "hello", nullValue: null, integer: 15, decimal: 3.14 }
            },
            objectsInArray: {
                message: "We should be able to handle top-level arrays:",
                inputs: {
                    primitives: [0, 1, 2],
                    deepObject: [{ foo: "bar" }]
                }
            },
            arraysInObject: {
                message: "We should be able to handle nested arrays:",
                inputs: [{ foo: [0, 1, 2] }]
            }
        };

        fluid.each(testDefs, function (testDef) {
            fluid.each(testDef.inputs, function (input, key) {
                var output = fluid.schema.stringify(input);
                try {
                    var parsedOutput = JSON.parse(output);
                    jqUnit.assertDeepEq(testDef.message + " (" + key + ")", input, parsedOutput);
                }
                catch (error) {
                    jqUnit.fail(error);
                }
            });
        });
    });

    jqUnit.test("Speed tests for `fluid.schema.stringify`.", function () {
        var start = Date.now();
        var passes = 5000;
        for (var a = 0; a < passes; a++) {
            fluid.schema.stringify(fluid.test.schema.payloads.deepAndBroad);
        }
        var end = Date.now() - start;
        var avgTime = end / passes;
        fluid.log("Completed " + passes + " stringify passes in " + end + " ms (avg. " + avgTime + " ms per pass).");
        jqUnit.assertTrue("Stringify should complete in a timely fashion.", end < 5000);
    });
})(fluid, jqUnit);
