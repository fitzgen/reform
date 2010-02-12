var JACK = require("jack");
var REFORM = require("reform");

var survey = new REFORM.Form({
    first_name: new REFORM.TextField(),
    last_name: new REFORM.TextField(),
    age: new REFORM.IntegerField(),
    email: new REFORM.EmailField({
        required: false,
        help_text: "I know some people are scared to get spam, so this field is optional."
    }),
    season: new REFORM.DropdownField({
        help_text: "What season is it right now?",
        choices: [
            ["su", "Summer"],
            ["w", "Winter"],
            ["sp", "Spring"],
            ["f", "Fall"]
        ]
    }),
    random: new REFORM.TextAreaField({
        label: "About me.",
        help_text: "Tell the world about anything about yourself!"
    }),
    submit: new REFORM.Button()
});

exports.app = function (env) {
    var resp = new JACK.Response();
    var req = new JACK.Request(env);
    var form = survey.clone(req.isPost() ? req.POST() : null);
    
    resp.setHeader("Content-Type", "text/html");
    
    if (req.isPost()) {
        if (form.is_valid()) {
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