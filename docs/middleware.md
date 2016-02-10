# The Schema "Gatekeeper" Middleware

Although you usually will build some fault tolerance into your components, on some level they expect to deal with
data that has the right structure, and which contains the expected type of information (strings, booleans, dates, etc).

The `gpii.schema.middleware` component provided with this package rejects invalid payloads, which allows your server-side
components to safely assume they will only receive JSON data in the correct format.

The component is intended to be wired into an existing rest endpoint as in the following example:

    var fluid = require("infusion");
    var gpii  = fluid.registerNamespace("gpii");

    require("gpii-express");
    require("gpii-json-schema");

    fluid.defaults("gpii.schema.tests.handler", {
      gradeNames: ["gpii.express.handler"],
      invokers: {
        handleRequest: {
          funcName: "{that}.sendResponse",
          args:     [200, "Someone sent me a valid JSON payload."]
        }
      }
    );

    gpii.express({
      gradeNames: ["gpii.express.requestAware.router"],
      handlerGrades: ["gpii.schema.tests.handler"],
      path: "/gatekeeper",
      components: {
        gatekeeper: {
          type: "gpii.schema.middleware",
          options: {
            schemaContent: { "type": "object", "properties": { "required": { "type": "boolean" } }, "required": ["required"]}
          }
        }
      }
    });

If you were to launch this example which is adapted from the tests in this package), you would have a rest endpoint
(/gatekeeper) that rejects all invalid responses and outputs a success message when the JSON is valid.

The component doesn't know anything about how you intend to use the data.  It only examines the payload and steps in if
the payload is not valid according to the configured JSON Schema.


 Validates information available in the request object, transformed using `options.rules.requestContentToValidate`.
 The default options validate the request body.  To validate a query instead, you would set that option to something like:

      requestContentToValidate: {
          "": "query"
      }

 The transformed request data is validated against the schema. Any validation errors are then transformed using
 `options.rules.validationErrorsToResponse` before they are sent to the user.  The default format looks roughly like:

     {
       ok: false,
       message: "The JSON you have provided is not valid.",
       errors: {
         field1: ["This field is required."]
       }
     }

 The output of this middleware is itself expected to be valid according to a JSON schema, and is delivered using a
 [`schemaHandler`](./handler.md).

# Configuration Options

## `options.schemaKey`
The key (also the filename) of the schema to be used for validation.

## `options.schemaPath`
The path (URI or filesystem) to a directory that contains a file matching `options.schemaKey`.

## `options.responseSchemaKey`
The schema key that [our handler](./handler.md) will use in constructing response headers.

## `options.responseSchemaUrl`
A base URL where `options.responseSchemaKey` can be found.

## `options.rules.requestContentToValidate`
The [rules to use in transforming](https://github.com/fluid-project/infusion-docs/blob/0e3862aaab38742c71f8f6e3e155a3b6d5199ad4/src/documents/ModelTransformationAPI.md#fluidmodeltransformwithrulessource-rules-options)
the incoming data before validation (see above).

## `options.rules.validationErrorsToResponse`

The [rules to use in transforming](https://github.com/fluid-project/infusion-docs/blob/0e3862aaab38742c71f8f6e3e155a3b6d5199ad4/src/documents/ModelTransformationAPI.md#fluidmodeltransformwithrulessource-rules-options)
validation errors before they are sent to the user (see above).

# Functions

## `gpii.schema.middleware.rejectOrForward(that, req, res, next)`

* `that`: The component itself.
* `req`: The [request object](http://expressjs.com/en/api.html#req) provided by Express.
* `res`: The [response object](http://expressjs.com/en/api.html#res) provided by Express.
* `next`: The next Express middleware or router function in the chain.
* Returns: Nothing.

Step in and interrupt the conversation if the JSON data supplied as part of `req` is not valid according to the JSON
Schema `options.schemaKey` found at `options.schemaPath`.  If the content is valid, execute the supplied `next` function
and let some other downstream piece of middleware continue the conversation.

This function is expected to be called by Express (or by an instance of `gpii.express`).