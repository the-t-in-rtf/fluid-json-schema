/* globals jqUnit, require */
/* eslint-env browser */
var fluid  = fluid  || {};
var jqUnit = jqUnit || {};

(function (fluid, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/hashString");
        require("./lib/test-payloads");
    }

    var gpii  = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.tests.schema");

    gpii.tests.schema.randomChar = function () {
        return String.fromCharCode(Math.round(Math.random() * 65535));
    };

    gpii.tests.schema.randomString = function (length) {
        return fluid.generate(length, gpii.tests.schema.randomChar, true).join("");
    };

    jqUnit.module("Testing string hashing.");

    jqUnit.test("Testing `gpii.schema.hashString` stability.", function () {
        // Stable ordering is not required for this test, so we can use JSON.stringify directly.
        var sampleSchemaPayload = JSON.stringify(gpii.test.schema.payloads.deepAndBroad);

        var firstHash = gpii.schema.hashString(sampleSchemaPayload);
        var secondHash = gpii.schema.hashString(sampleSchemaPayload);

        jqUnit.assertEquals("Hashes for the same schema should be stable over repeated runs.", firstHash, secondHash);

        var otherHash = gpii.schema.hashString("something else.");
        jqUnit.assertTrue("Hashes for different material should be different.", otherHash !== firstHash);
    });

    // This is provided for more exhaustive sanity checking, but not normally run, as it takes around 8 minutes to go
    // through all 175k iterations.

    //jqUnit.test("Testing `gpii.schema.hashString` for collisions (exhaustive).", function () {
    //    // Attempt to produce a collision by changing individual characters in a very large string.  The length of the
    //    // test string is based on the character length of the largest solution in the legacy win32.json file (JAWS).
    //    var hashesToDate  = [];
    //    var massiveString = gpii.tests.schema.randomString(175000);
    //    var baselineHash  = gpii.schema.hashString(massiveString);
    //    hashesToDate.push(baselineHash);
    //
    //    var collisions = 0;
    //    for (var a = 0; a < massiveString.length; a++ ) {
    //        var leader        = massiveString.substring(0, a);
    //        var previousChar  = massiveString.substring(a, a + 1);
    //        var trailer       = massiveString.substring(a + 1);
    //        var tweakedChar   = gpii.tests.schema.randomChar();
    //        var tweakedString = leader + tweakedChar + trailer;
    //        if (tweakedString !== massiveString) {
    //            var newHash = gpii.schema.hashString(tweakedString);
    //            if (hashesToDate.indexOf(newHash) !== -1) {
    //                fluid.log("duplicate hash '" + newHash + "' when changing character " + a + " from '" + previousChar + "' to '" + tweakedChar + "'.");
    //                collisions++;
    //            }
    //            hashesToDate.push(newHash);
    //        }
    //    }
    //    jqUnit.assertEquals("There should be no hash collisions.", 0, collisions);
    //});

    // Attempt to provoke a collision by changing random characters in the original string.
    jqUnit.test("Testing `gpii.schema.hashString` for collisions (sampling).", function () {
        // Attempt to produce a collision by changing individual characters in a very large string.  The length of the
        // test string is based on the character length of the largest solution in the legacy win32.json file (JAWS).
        var hashesToDate  = [];
        var massiveString = gpii.tests.schema.randomString(175000);
        var baselineHash  = gpii.schema.hashString(massiveString);
        hashesToDate.push(baselineHash);

        var passes = 10000;
        var collisions = 0;
        for (var a = 0; a < passes; a++ ) {
            var charToTweak   = Math.round(Math.random() * massiveString.length);
            var leader        = massiveString.substring(0, charToTweak);
            var previousChar  = massiveString.substring(charToTweak, charToTweak + 1);
            var trailer       = massiveString.substring(charToTweak + 1);

            // Guard against randomly picking the exact same character.
            var tweakedChar   = previousChar;
            while (tweakedChar === previousChar) {
                tweakedChar = gpii.tests.schema.randomChar();
            }

            var tweakedString = leader + tweakedChar + trailer;
            var newHash = gpii.schema.hashString(tweakedString);
            if (hashesToDate.indexOf(newHash) !== -1) {
                fluid.log("duplicate hash '" + newHash + "' when changing character " + a + " from '" + previousChar + "' to '" + tweakedChar + "'.");
                collisions++;
            }
            hashesToDate.push(newHash);
        }
        jqUnit.assertEquals("There should be no hash collisions.", 0, collisions);
    });

    jqUnit.test("Speed tests for `gpii.schema.hashString`.", function () {
        // Although we will typically be dealing with smaller payloads, the largest observed solution in the
        // legacy Solutions Registry is ~175,000 characters, so we test our ability to handle those in a timely fashion.
        // Stable ordering is not required for this test, so we can use `JSON.stringify` directly.
        var massiveString = gpii.tests.schema.randomString(175000);

        var start = Date.now();
        var passes = 1000;
        for (var a = 0; a < passes; a++) {
            gpii.schema.hashString(massiveString);
        }
        var end = Date.now() - start;
        var avgTime = end / passes;
        fluid.log("Completed " + passes + " string hash passes in " + end + " ms (avg. " + avgTime + " ms per pass).");
        jqUnit.assertTrue("String hashing should complete in a timely fashion.", end < 2000);
    });
})(fluid, jqUnit);
