This

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

        resp.write(form.toHtml("div"));
        return resp.finish();
    };

returns to this as HTML:

    <div>
      <label for="id_first_name">First Name</label>


      <input type="text"
             name="first_name"
             id="id_first_name"
             value="" />
    </div>
    <div>
      <label for="id_last_name">Last Name</label>


      <input type="text"
             name="last_name"
             id="id_last_name"
             value="" />
    </div>
    <div>
      <label for="id_age">Age</label>



      <input type="text"
             name="age"
             id="id_age"
             value="" />
    </div>
    <div>
      <label for="id_email">Email</label>
      <p class='form-help-text'>I know some people are scared to get spam, so this field is optional.</p>

      <input type="text"
             name="email"
             id="id_email"
             value="" />
    </div>
    <div>
      <label for="id_season">Season</label>

      <p class='form-help-text'>What season is it right now?</p>

      <select name="season" id="id_season">
        <option value="su">Summer</option>
    <option value="w">Winter</option>
    <option value="sp">Spring</option>
    <option value="f">Fall</option>
      </select>
    </div>

    <div>
      <label for="id_random">About me.</label>
      <p class='form-help-text'>Tell the world about anything about yourself!</p>

      <textarea id="id_random" name="random"></textarea>
    </div>
    <div>
      <input type="submit"
             name="submit"
             id="id_submit"
             value="Submit" />
    </div>
