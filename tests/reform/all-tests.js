var assert = require("test/assert");
var util = require("util");
var reform = require("reform");

exports["test _safeNewWrap protects against the new keyword"] = function () {
    var field = new reform.TextField();
    assert.isTrue(field instanceof reform.TextField, "Works with the new keyword");
    field = reform.TextField();
    assert.isTrue(field instanceof reform.TextField, "Works without the new keyword");
};

require("test/runner").run(exports);
