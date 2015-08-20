// Helper function to assemble usable test cases that pause at all the right times instead of either not running at all
// or failing because they ran too early.
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.schema.tests");
gpii.schema.tests.addRequiredSequences = function (sequenceStart, rawTests) {
    var completeTests = fluid.copy(rawTests);

    for (var a = 0; a < completeTests.length; a++) {
        var testSuite = completeTests[a];
        for (var b = 0; b < testSuite.tests.length; b++) {
            var tests = testSuite.tests[b];
            tests.sequence = sequenceStart.concat(tests.sequence);
        }
    }

    return completeTests;
};
