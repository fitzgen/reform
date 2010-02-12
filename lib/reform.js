var util = require("util");

var _safe_new_wrap = function (fn) {
    return function (options) {
        if (!(this instanceof arguments.callee)) {
            return new fn(options);
        } else {
            fn.apply(this, arguments);
            return this;
        }
    };
};

var _generate_constructor = function (name) {
    return _safe_new_wrap(function (options) {
                              util.update(this, options);
                              this._name = name;
                          });
};

// Simple helper templater for rendering forms to HTML
function _simple_render(template, context) {
    return template.replace(/\(\([ ]*?([\w]+?)[ ]*?\)\)/gi,
                            function (whole_match, group) {
                                return context[group] || "";
                            });
}

// Generate a label as best we can. ("form_field" => "Form Field")
function _make_label(field_name) {
    return util.splitName(util.title(field_name)).join(" ");
}

function _clone(obj) {
    var F = function () {};
    F.prototype = obj;
    return new F();
}

// Throw this error inside a field's "clean" function to signal that the field
// did not validate.
var FormValidationError = _safe_new_wrap(function (message) {
    this.message = message;
});
FormValidationError.prototype = new Error();
FormValidationError.prototype.name = "FormValidationError";
exports.FormValidationError = FormValidationError;

// FORM FIELDS

var BaseFormField = _generate_constructor("BaseFormField");
BaseFormField.prototype.required = true;
BaseFormField.prototype.label = "";
BaseFormField.prototype.help_text = "";
BaseFormField.prototype.initial = "";
BaseFormField.prototype.input_type = "text";
BaseFormField.prototype.clean = function (data) {
    throw new Error("Not implemented");
};
BaseFormField.prototype.toHtml = function (tag_style) {
    return _simple_render(this.template, {
        name: this.name,
        value: this.initial || "",
        input_type: this.input_type,
        tag: tag_style || "li",
        help_text: this.help_text ?
            "<p class='form-help-text'>" + this.help_text + "</p>" :
            "",
        label: this.label,
        error: this.error === undefined ?
            "" :
            _simple_render(this.error_template, {
                message: this.error
            })
    });
};
BaseFormField.prototype.toString = function () {
    return "[object reform." + this._name + "]";
};
BaseFormField.prototype.template = [
    '<((tag))>',
    '  <label for="id_((name))">((label))</label>',
    '  ((help_text))',
    '  ((error))',
    '  <input type="((input_type))"',
    '         name="((name))"',
    '         id="id_((name))"',
    '         value="((value))" />',
    '</((tag))>'
].join("\n");
BaseFormField.prototype.error_template = [
    '<p class="form-validation-error">',
    '  (( message ))',
    '</p>'
].join("");

var TextField = _generate_constructor("TextField");
TextField.prototype = new BaseFormField();
TextField.prototype.clean = function (data) {
    data = util.trim(data);

    if (data.length > 0) {
        return data;
    } else {
        if (this.required) {
            throw new FormValidationError("This field is required.");
        } else {
            return null;
        }
    }
};
exports.TextField = TextField;

var TextAreaField = _generate_constructor("TextAreaField");
TextAreaField.prototype = new TextField();
TextAreaField.prototype.template = [
    '<(( tag ))>',
    '  <label for="id_(( name ))">(( label ))</label>',
    '  (( help_text ))',
    '  (( error ))',
    '  <textarea id="id_(( name ))" name="(( name ))">(( value ))</textarea>',
    '</(( tag ))>'
].join("\n");
exports.TextAreaField = TextAreaField;

var EmailField = _generate_constructor("EmailField");
EmailField.prototype = new BaseFormField();
EmailField.prototype.toString = function () {
    return "[object reform.EmailField]";
};
EmailField.prototype.clean = function (data) {
    data = util.trim(data);

    if (data === "") {
        if (this.required) {
            throw new FormValidationError("This field is required.");
        } else {
            return null;
        }
    } else {
        email_re = /^[\w\.\-]+?@[\w\-]+?(?:\.[\w\-]+)+?/i;
        if (email_re.exec(data) !== null) {
            return data;
        } else {
            throw new FormValidationError("Invalid email address.");
        }
    }
};
exports.EmailField = EmailField;

var PasswordField = _generate_constructor("PasswordField");
PasswordField.prototype = new TextField();
PasswordField.prototype.input_type = "password";
PasswordField.prototype.toString = function () {
    return "[object reform.PasswordField]";
};
exports.PasswordField = PasswordField;

var IntegerField = _generate_constructor("IntegerField");
IntegerField.prototype = new BaseFormField();
IntegerField.prototype.toString = function () {
    return "[object reform.IntegerField]";
};
IntegerField.prototype.clean = function (data) {
    var i, l, c;
    data = util.trim(data);
    if (data.match(/\D/gi) !== null) {
        throw new FormValidationError("This field must contain a non-decimal number.");
    }
    return parseInt(data, 10);
};
exports.IntegerField = IntegerField;

Button = _generate_constructor("Button");
Button.prototype = new BaseFormField();
Button.prototype.input_type = "submit";
Button.prototype.label = "Submit";
Button.prototype.required = false;
Button.prototype.clean = function (data) {
    return data;
};
Button.prototype.template = [
    '<(( tag ))>',
    '  <input type="(( input_type ))"',
    '         name="(( name ))"',
    '         id="id_(( name ))"',
    '         value="(( label ))" />',
    '</(( tag ))>'
].join("\n");
exports.Button = Button;

var BaseChoiceField = _generate_constructor("BaseChoiceField");
BaseChoiceField.prototype = new BaseFormField();
BaseChoiceField.prototype.template = '(( choices ))';

var _choice_val = function (choice_pair) {
    return choice_pair[0];
};
var _choice_label = function (choice_pair) {
    return choice_pair[1];
};
var _nth_val = function (choices, i) {
    return _choice_val(choices[i]);
};
var _nth_label = function (choices, i) {
    return _choice_label(choices[i]);
};

BaseChoiceField.prototype.toHtml = function (tag_style) {
    var that = this;
    return _simple_render(
        this.template, {
            choices: (function () {
                          var choices = [];
                          for (var i = 0; i < that.choices.length; i++) {
                              choices.push(_simple_render(
                                               that.choice_template, {
                                                   choice_val: _nth_val(that.choices, i),
                                                   choice_label: _nth_label(that.choices, i),
                                                   i: i,
                                                   name: that.name
                                               }
                                           ));
                          }
                          return choices.join("\n");
                      }()),
            name: this.name,
            label: this.label,
            help_text: this.help_text ?
                "<p class='form-help-text'>" + this.help_text + "</p>" :
                "",
            tag: tag_style || "li",
            error: this.error === undefined ?
                "" :
                _simple_render(this.error_template, {
                    message: this.error
                })
        }
    );
};
BaseChoiceField.prototype.clean = function (data) {
    for (var i = 0; i < this.choices.length; i++) {
        if (data === _nth_val(this.choices, i)) {
            return data;
        }
    }
    if (this.required === true) {
        throw new FormValidationError("This field is required.");
    } else {
        return null;
    }
};

var RadioChoiceField = _generate_constructor("RadioChoiceField");
RadioChoiceField.prototype = new BaseChoiceField();
RadioChoiceField.prototype.toString = function () {
    return "[object reform.RadioChoiceField]";
};
RadioChoiceField.prototype.template = [
    '<(( tag ))>',
    '  <label>(( label ))</label>',
    '  (( help_text ))',
    '  (( error ))',
    '  <ul class="form-radio-list">',
    '    (( choices ))',
    '  </ul>',
    '</(( tag ))>'
].join("\n");
RadioChoiceField.prototype.choice_template = [
    '<li>',
    '  <label for="id_(( name ))(( i ))">',
    '  <input id="id_(( name ))(( i ))"',
    '         type="radio"',
    '         name="(( name ))"',
    '         value="(( choice_val ))" />',
    '  (( choice_label ))',
    '  </label>',
    '</li>'
].join("\n");
exports.RadioChoiceField = RadioChoiceField;

var DropdownField = _generate_constructor("DropdownField");
DropdownField.prototype = new BaseChoiceField();
DropdownField.prototype.toString = function () {
    return "[object reform.DropdownField]";
};
DropdownField.prototype.template = [
    '<(( tag ))>',
    '  <label for="id_(( name ))">(( label ))</label>',
    '  (( help_text ))',
    '  (( error ))',
    '  <select name="(( name ))" id="id_(( name ))">',
    '    (( choices ))',
    '  </select>',
    '</(( tag ))>'
].join("\n");
DropdownField.prototype.choice_template = [
    '<option value="(( choice_val ))">',
    '(( choice_label ))',
    '</option>'
].join("");
exports.DropdownField = DropdownField;

// FORMS

var Form = _safe_new_wrap(function (fields) {
    var field;
    this.fields = fields;
    for (field in this.fields) {
        fields[field].name = field;
        if (fields[field].label === "") {
            fields[field].label = _make_label(field);
        }
    }
});

Form.prototype.bind_data = function (data) {
    var field, field_name;
    this.is_bound = true;
    this.data = data;

    for (field_name in this.data) {
        field = this.fields[field_name];
        
        if (field instanceof BaseFormField) {
            field.initial = this.data[field_name];
        }
    }

    return this;
};

Form.prototype.is_valid = function () {
    var that = this;
    var valid_status = true;
    var validation_error = function (field, message) {
        if (that.errors === undefined) {
            that.errors = {};
        }
        that.errors[field] = message;
        that.fields[field].error = message;
        valid_status = false;
        return message;
    };
    
    if (that.is_bound === true) {
        that.cleaned_data = {};

        for (field in that.fields) {
            if (that.fields.hasOwnProperty(field)) {
                try {
                    that.cleaned_data[field] = that.fields[field].clean(that.data[field] || "");
                } catch (e) {
                    if (e instanceof FormValidationError) {
                        validation_error(field, e.message);
                    } else {
                        throw e;
                    }
                }
            }
        }
    }

    return valid_status && that.is_bound;
};
Form.prototype._name = "Form";
Form.prototype.toString = function () {
    return "[object reform." + this._name + "]";
};
Form.prototype.toHtml = function (tag_style) {
    tag_style = tag_style || "li";
    var parts = [];
    // If it is not bound we don't want to try to validate it.
    var is_valid = this.is_bound ? this.is_valid() : true;
    for (field in this.fields) {
        parts.push(this.fields[field].toHtml(tag_style));
    }
    return parts.join("\n");
};

// Create a clone of this form. Optionally, pass in data to be bound to the
// newly cloned form.
Form.prototype.clone = function (data) {
    var clone = _clone(this);
    clone.fields = {};

    for (field in this.fields) {
        clone.fields[field] = _clone(this.fields[field]);
    }

    if (data) {
        clone.bind_data(data);
    }

    return clone;
};

exports.Form = Form;
