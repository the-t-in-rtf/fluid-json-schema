/* eslint-env browser */
(function (fluid) {
    "use strict";
    fluid.registerNamespace("fluid.tests.schema.messageLoadingRunner");

    // TODO: If this gets any more convoluted, convert to a test environment or other component hierarchy.
    fluid.tests.schema.messageLoadingRunner.runTests = function (that) {
        fluid.setGlobalValue("fluid.tests.schema.defaultMessageBundle", that.resources.messages.parsed);
        fluid.tests.schema.validator.staticFunctionTests();
    };

    fluid.defaults("fluid.tests.schema.messageLoadingRunner", {
        gradeNames: ["fluid.resourceLoader"],
        resources: {
            messages: {
                url: "/messages",
                dataType: "json"
            }
        },
        listeners: {
            "onResourcesLoaded.runTests": {
                funcName: "fluid.tests.schema.messageLoadingRunner.runTests",
                args: ["{that}"]
            }
        }
    });
    fluid.tests.schema.messageLoadingRunner();
})(fluid);
