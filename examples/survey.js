var JACK = require("jack");
var REFORM = require("reform");

var survey = new REFORM.Form({
    firstName: new REFORM.TextField(),
    lastName: new REFORM.TextField(),
    age: new REFORM.IntegerField(),
    email: new REFORM.EmailField({
        required: false,
        helpText: "I know some people are scared to get spam, so this field is optional."
    }),
    season: new REFORM.DropdownField({
        helpText: "What season is it right now?",
        choices: [
            ["su", "Summer"],
            ["w", "Winter"],
            ["sp", "Spring"],
            ["f", "Fall"]
        ]
    }),
    random: new REFORM.TextAreaField({
        label: "About me.",
        helpText: "Tell the world about anything about yourself!"
    }),
    submit: new REFORM.Button()
});

exports.app = function (env) {
    var resp = new JACK.Response();
    var req = new JACK.Request(env);
    var form = survey.clone(req.isPost() ? req.POST() : null);

    resp.setHeader("Content-Type", "text/html");

    if (form.isBound) {
        if (form.isValid()) {
            resp.write("<p>The form is valid!</p>");
        } else {
            resp.write("<p>The form is not valid!</p>");
        }
    }

    resp.write('<form method="POST">');
    resp.write(form.toHtml("div"));
    resp.write('</form>');
    return resp.finish();
};