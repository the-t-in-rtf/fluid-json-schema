/* global fluid, jQuery */
(function () {
    "use strict";
    fluid.defaults("gpii.schema.tests.errorBinder", {
        gradeNames: ["gpii.schemas.client.errorAwareForm.clientSideValidation"],
        hideOnSuccess: false,
        ajaxOptions: {
            url:    "/gated/POST",
            method: "POST"
        },
        schemaKey: "evolved.json",
        templates: {
            initial:     "errorBinder-viewport"
        },
        rules: {
            modelToRequestPayload: {
                "":                "notfound",
                shallowlyRequired: "shallowlyRequired",
                testString:        "testString",
                testAllOf:         "testAllOf",
                succeed:           "succeed",
                deep: {
                    deeplyRequired:    "deeplyRequired"
                }
            },
            successResponseToModel: {
                successMessage: { literalValue: "Record validated on the server side."}
            }
        },
        model: {
        },
        bindings: {
            // We use both styles of bindings to confirm that they each work with the `errorBinder`.
            shallowlyRequired: "shallowlyRequired",
            testString: {
                selector: "testString",
                path:     "testString"
            },
            testAllOf: "testAllOf",
            deeplyRequired: "deeplyRequired",
            succeed: "succeed"
        },
        selectors: {
            shallowlyRequired: "input[name='shallowlyRequired']",
            testString:        "input[name='testString']",
            testAllOf:         "input[name='testAllOf']",
            deeplyRequired:    "input[name='deeplyRequired']",
            succeed:           "input[name='succeed']"
        }
    });
})(jQuery);

