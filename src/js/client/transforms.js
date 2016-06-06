/*

    Model transformation functions useful in validating form content.

 */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schemas.transforms");

/*

    A transform function to optionally strip empty strings when they are relayed.  Add this to your binder component
    using code like:

    ```
    bindings: {
        sample: {
            selector: "sample",
            path:     "sample",
            rules: {
                domToModel: {
                    "": {
                        transform: {
                            funcName:  "gpii.schemas.transforms.stripEmptyString",
                            inputPath: ""
                        }
                    }
                }
            }
        }
    }
    ```

 */
gpii.schemas.transforms.stripEmptyString = function (value) {
    return value === "" ? null : value;
};

fluid.defaults("gpii.schemas.transforms.stripEmptyString", {
    gradeNames: ["fluid.standardTransformFunction"]
});