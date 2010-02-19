exports["Test Reform"] = require("./reform/all-tests");

if (require.main == module.id)
    require('test/runner').run(exports);