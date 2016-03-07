
# What is the parser?

[JSON Schema](http://json-schema.org/) is a standard for describing JSON data formats using JSON notation.  Simple
schemas are more or less human-readable descriptions of what structure is expected and what data is allowed at each
level.

You can reuse content within or between schemas using the `$ref` notation, which allows you to refer to content found
elsewhere.  Schemas that make use of the `$ref` notation are not generally human readable, especially when there is a
chain of inherited definitions that must each be retrieved and understood before you reach the level of "simple" rules.

This component parses a JSON Schema and dereferences all of its `$ref` links (including chains of references).  The
final result is a JSON Schema that enforces the same structure as the original, but which is composed only of "simple"
rules.

# What is it used for?

The parser can be used to present a simplified (dereferenced schema).  Our first use case is adding partial support for
custom error messages as outlined in [draft v5 of the JSON Schema standard](https://github.com/json-schema/json-schema/wiki/Custom-error-messages-(v5-proposal)).
See [the documentation for the `evolveErrors` function](evolveErrors.md) for details.

# Requirements

This component uses [json-schema-ref-parser](https://github.com/BigstickCarpet/json-schema-ref-parser).  We configure
it using `options.parserOptions` (empty by default).  Read the library's documentation for details of [what options
are available](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/master/docs/options.md).

# `gpii.schema.parser`

A server-side parser which loads and dereferences schema content on startup.

## Component Options

The following component configuration options are supported:

|  Option      |   Type   | Description |
| ------------ | -------- | ----------- |
| `schemaDirs` | `String` or `Array` | The location of the directory or directories containing all schemas used by the parser.   Each entry should be a package-relative path such as `%gpii-handlebars/tests/schemas`.|


## Invokers

The `parser` component provides the following invokers:

### `{parser}.dereferenceSchema(schemaPath, schemaKey)`

* `schemaPath {String}`:  A path (server side )or URI (client side) to the directory or base URL where the schema can be found.  Will be combined with `schemaKey` to construct the full location of the schema.
* `schemaKey {String}`: The filename of the schema relative to `schemaPath`.
* Returns: A `promise` that will be satisfied when the parser finishes its work.  The promise itself does not return any value.

Dereference a single schema.  As the process is asynchronous, this function returns a promise.  Typically accessed
using the parser component's `dereferenceSchema` invoker and the `schemaKey` attribute.

