# What is this?

[JSON Schemas](http://json-schema.org) are JSON documents that describe how a JSON object should be structured.  The
JSON Schema standard includes rules about what fields are required, what type and format of data is allowed in a field,
and many other complex rules that allow you to do things like limit the length of a text field, or require between one
and three entries in an array.

This package provides a series of [Fluid components](https://github.com/fluid-project/infusion-docs/blob/master/src/documents/UnderstandingInfusionComponents.md)
to help add the power of [JSON Schemas](http://json-schema.org) to your project.

This package is intended to help with three key use cases:

1.  Validating arbitrary JSON data and reporting problems to the end user.
2.  Rejecting invalid data sent to a REST endpoint (presumably via a POST or PUT request).
3.  Adding appropriate headers to JSON responses so that it is clear what JSON Schema they adhere to.

# Validation

JSON is a very flexible format, which allows it to cover a wide range of use cases.  However, in most cases you will
want to impose some practical limitations on the data you will accept.

JSON Schemas provide a clear way to indicate what is and is not valid within a given JSON document.  You might use JSON
Schemas to validate a form's data on the client side before attempting to submit it to the server.  You might also
validate the data whenever the model changes.

This package provides client and server side validators, which share a common base package.  To use this on the client
side, start with `gpii.schema.validator.client`.  To use it on the server side, start with `gpii.schema.validator.server`.
Each package contains more detailed documentation about its use.  Here is an example of how it might work from within
node:

  var fluid = fluid || require("infusion);
  var gpii  = fluid.registerNamespace("gpii");

  require("gpii-json-schema");
  var validator = gpii.schema.validator({
    schemaContents: {
      sample: { "type": "object", "properties": { "required": { "type": "boolean" } }, "required": ["required"]}
    }
  });

  var errors = validator.validate("sample", { foo: "bar" });
  if (errors) {
    // Complain
  }
  else {
    // Rejoice
  }

One of the key strengths of JSON Schema is that it allows you to compose a complex schema out of parts taken from
other schemas.  The validator in this package supports references between JSON Schemas.

Inheritance is still a sticking point at least in v4 of the draft standard.   You cannot safely expect to overlay
multiple schemas on top of each other.  Best practice for now is to only reuse individual definitions between schemas,
and to explicitly specify each schema's required properties.

See the tests for examples of the preferred and tested approach (see the example schemas `derived.json` and `base.json`).

# Rejecting invalid REST payloads

Although you usually will build some fault tolerance into your components, on some level they expect to deal with
data that has the right structure, and which contains the expected type of information (strings, booleans, dates, etc).

The `gpii.schema.middleware` component provided with this package rejects invalid payloads, which allows your server-side
components to safely assume they will only receive JSON data in the correct format.

The component is intended to be wired into an existing rest endpoint as in the following example:

    var fluid = fluid || require("infusion");
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
the payload is not valid according to the configured JSON Schema.  The JSON Schema language lets you combine and reuse
part or all of an existing schema (with the caveats described above), so you should be able to describe a broad range
of data you accept in a single JSON Schema.

# Adding headers to REST responses

When writing REST interfaces, we also commonly return JSON data in response to a request.  JSON Schemas can also be
used to provide hints about the output format we are using.

The working group that writes the JSON Schema standard [has outlined two approaches for labeling outgoing responses](http://json-schema.org/latest/json-schema-core.html#anchor33).
Both of these involve setting HTTP headers in the outgoing response, as in:

    Content-Type: application/my-media-type+json; profile="http://example.com/my-hyper-schema#"
    Link: <http://example.com/my-hyper-schema#>; rel="describedBy"

The `gpii.schema.response` component provided with this package extends the server side validator
(`gpii.schema.validator.server`), and is intended to be used in conjunction with a `gpii.express.handler`.  For
examples, see the tests in this package.

# Using the validator in a browser

To use this component in a browser, you will need to run `browserify` against ajv and generate a client-side bundle,
using commands like the following:

    npm install -g browserify
    browserify -r ajv -o ajv.bundle.js