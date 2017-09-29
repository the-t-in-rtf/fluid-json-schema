"use strict";
/* eslint-env node */
require("./hasRequiredOptions-tests");
require("./middleware-contentAware-tests");
require("./middleware-requestAware-tests");
require("./parser-tests");
// TODO: Work with Antranig to figure out why the parser errors are not being trapped correctly.
require("./parser-update-failure-tests");
require("./pointer-function-tests");
require("./schema-inline-router-tests");
require("./url-assembler-tests");
require("./validate-server-tests");
require("./validator-evolved-error-tests");
