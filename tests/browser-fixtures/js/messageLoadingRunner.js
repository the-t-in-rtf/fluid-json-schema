/* eslint-env browser */
(function (fluid) {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.tests.schema.messageLoadingRunner");

    // TODO: If this gets any more convoluted, convert to a test environment or other component hierarchy.
    gpii.tests.schema.messageLoadingRunner.runTests = function (that) {
        fluid.setGlobalValue("gpii.tests.schema.defaultMessageBundle", that.resources.messages.parsed);
        gpii.tests.schema.validator.staticFunctionTests();
    };

    fluid.defaults("gpii.tests.schema.messageLoadingRunner", {
        gradeNames: ["fluid.resourceLoader"],
        resources: {
            messages: {
                url: "/messages",
                dataType: "json"
            }
        },
        listeners: {
            "onResourcesLoaded.runTests": {
                funcName: "gpii.tests.schema.messageLoadingRunner.runTests",
                args: ["{that}"]
            }
        }
    });
    gpii.tests.schema.messageLoadingRunner();
})(fluid);
