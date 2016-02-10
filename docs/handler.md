# The JSON Schema Request Handler

When writing REST interfaces, we also commonly return JSON data in response to a request.  JSON Schemas can also be
used to provide hints about the output format we are using.

The working group that writes the JSON Schema standard [has outlined two approaches for labeling outgoing responses](http://json-schema.org/latest/json-schema-core.html#anchor33).
Both of these involve setting HTTP headers in the outgoing response, as in:

    Content-Type: application/my-media-type+json; profile="http://example.com/my-hyper-schema#"
    Link: <http://example.com/my-hyper-schema#>; rel="describedBy"

The `gpii.schema.handler` component provided with this package extends the server side validator
(`gpii.schema.validator.server`), and is intended to be used in conjunction with either the "request aware" or "content
aware" routers provided by the `gpii-express` package.

For examples of how to use this handler, see the tests in this package.  For more details on the underlying handler and
router grades provided by `gpii-express`, see [that package's documentation](https://github.com/GPII/gpii-express).

# Configuration Options

You are expected to provide two key options:

1. `options.schemaKey`: A short key for the schema that will represent it in the `Content-Type` header.
2. `options.schemaUrl`:  A URL for the schema, which will be included in both the `Link` and `Content-Type` headers.

Note that this will not actually implement the required `handleRequest` invoker.  You are expected to do that in your
own component, but you can use `that.sendResponse` as you would normally with any `gpii.express.handler` grade.

See the tests in this package for working examples.

# Functions

## `gpii.schema.handler.sendResponse(that, response, statusCode, body)`

* `that`:  The component itself.
* `response {Object}`: The [response object](http://expressjs.com/en/api.html#res) passed to us by our `gpii.express` instance.
* `statusCode {Integer}`: An integer representing the [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) to send as part of the response.
* `body {Object}`:  The response payload to send to the user. This should be JSON that matches the schema provided.
* Returns: Nothing.

Send the appropriate headers and then let the underlying `gpii.express.handler` grade's `sendResponse` function take 
over.  Typically called using this component's `sendResponse` invoker and the last two arguments.
