# What is this?

[JSON Schemas](http://json-schema.org) are JSON documents that describe how a JSON object should be structured.  The
JSON Schema standard includes rules about what fields are required, what type and format of data is allowed in a field,
and many other complex rules that allow you to do things like limit the length of a text field, or require between one
and three entries in an array.

This package provides a series of [Fluid components](https://github.com/fluid-project/infusion-docs/blob/master/src/documents/UnderstandingInfusionComponents.md)
to help add the power of [JSON Schemas](http://json-schema.org) to your project.

This package is intended to help with three key use cases:

1.  Validating arbitrary JSON data and reporting problems to the end user.  See the [validator documentation](./docs/validator.md) and [parser documentation](./docs/parser.md) for more details.
2.  Rejecting invalid data sent to a REST endpoint (presumably via a POST or PUT request).  See the [middleware documentation](./docs/middleware) for more details.
3.  Adding appropriate headers to JSON responses so that it is clear what JSON Schema they adhere to.  See the [handler documentation](./docs/handler.md) for more details.

# Requirements

Before you can install this package, `browserify` must be installed and in your path.  You can install `browserify`
globally using a command like:

`npm install -g browserify`

# Using these components in a browser

This package depends on AJV.  AJV can be used on the client-side, but must first be bundled using `browserify`.

The AJV package provides an npm script to run `browserify` with the correct options.  We use the `grunt-exec` plugin to
run this task automatically as part of our `postinstall` tasks.

Once the `postinstall` tasks have completed, the bundled version of AJV can be found in `./node_modules/ajv/ajv.bundle.js`.