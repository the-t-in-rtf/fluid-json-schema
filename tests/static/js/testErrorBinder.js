/* global fluid, jQuery */
(function () {
    "use strict";
    fluid.defaults("gpii.schema.tests.errorBinder", {
        gradeNames: ["gpii.schemas.client.errorAwareForm"],
        hideOnSuccess: false,
        ajaxOptions: {
            url: "/login",
            method: "POST"
        },
        templates: {
            initial:     "errorBinder-viewport",
            success:     "common-success",
            error:       "common-error",
            inlineError: "inline-error"
        },
        model: {
        },
        bindings: {
            // We use both styles of bindings to confirm that they each work with the `errorBinder`.
            username: "username",
            password: {
                selector: "password",
                path:     "password"
            }
        },
        selectors: {
            username: "input[name='username']",
            password: "input[name='password']",
            // TODO: Wire this up to submit even if there are errors
            forceSubmit: ".forceSubmit"
        }
    });
})(jQuery);

