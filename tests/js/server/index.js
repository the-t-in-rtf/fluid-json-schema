"use strict";

require("./handler-tests");
require("./middleware-contentAware-tests");
require("./middleware-requestAware-tests");
require("./parser-tests");
require("./pointer-function-tests");
require("./schema-inline-router-tests");
require("./validate-server-tests");
require("./validator-evolved-error-tests");

// TODO:  Review with Antranig.  If we enable this we get errors like the following.  The same tests run as expected when launched individually.
/*
 15:53:03.547:  jq: FAIL: Test name "Confirming that the handler adds the appropriate headers..." - Message: Unexpected failure in test case (see following log for more details): ok() assertion outside test context, was     at pok (/Users/duhrer/Source/rtf/gpii-json-schema/node_modules/infusion/tests/test-core/jqUnit/js/jqUnit.js:110:15)
 at Object.jsUnitCompat.assertTrue (/Users/duhrer/Source/rtf/gpii-json-schema/node_modules/infusion/tests/test-core/jqUnit/js/jqUnit.js:143:13)
 at gpii.schema.tests.checkResponseHeaders (/Users/duhrer/Source/rtf/gpii-json-schema/tests/js/lib/checkResponseHeaders.js:15:16)
 */
//require("./parser-update-failure-tests");
