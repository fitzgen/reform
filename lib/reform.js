var util = require("util");

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
function FormValidationError(message) {
    this.message = message;
}
FormValidationError.prototype = new Error();
FormValidationError.prototype.name = "FormValidationError";
exports.FormValidationError = FormValidationError;

// FORM FIELDS

function BaseFormField() {}
BaseFormField.prototype.required = true;
BaseFormField.prototype.label = "";
BaseFormField.prototype.help_text = "";
BaseFormField.prototype.initial = "";
BaseFormField.prototype.input_type = "text";
BaseFormField.prototype.clean = function (data) {
    throw new Error("Not implemented");
};
BaseFormField.prototype.toHtml = function (tag_style) {
    var template = [
        "<((tag))>",
        "  <label for=\"id_((name))\">((label))</label>",
        "  ((help_text))",
        "  <input type=\"((input_type))\"",
        "         name=\"((name))\"",
        "         id=\"id_((name))\"",
        "         value=\"((value))\" />",
        "</((tag))>"
    ].join("\n");
    return _simple_render(template, {
                             name: this.name,
                             value: this.initial || "",
                             input_type: this.input_type,
                             tag: tag_style || "li",
                             help_text: this.help_text ?
                                 "<p>" + this.help_text + "</p>" :
                                 "",
                             label: this.label
                         });
};
BaseFormField.prototype.toString = function () {
    return "[object reform.BaseFormField]";
};

function TextField (options) {
    util.update(this, options);
}
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
TextField.prototype.toString = function () {
    return "[object reform.TextField]";
};
exports.TextField = TextField;

function EmailField(options) {
    util.update(this, options);
}
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

function PasswordField(options) {
    util.update(this, options);
}
PasswordField.prototype = new TextField();
PasswordField.prototype.input_type = "password";
PasswordField.prototype.toString = function () {
    return "[object reform.PasswordField]";
};
exports.PasswordField = PasswordField;

function IntegerField(options) {
    util.update(this, options);    
}
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

// FORMS

function Form(fields) {
    this.fields = fields;
    for (field in this.fields) {
        fields[field].name = field;
        if (fields[field].label === "") {
            fields[field].label = _make_label(field);
        }
    }
}

Form.prototype.bind_data = function (data) {
    this.is_bound = true;
    this.data = data;
    return this;
};

Form.prototype.is_valid = function () {
    var valid_status = true,
    validation_error = function (field, message) {
        if (this.errors === undefined) {
            this.errors = {};
        }
        this.errors[field] = message;
        return message;
    };
    this.cleaned_data = {};

    for (field in this.fields) {
        if (this.fields.hasOwnProperty(field)) {
            if (this.fields[field].required && this.data[field] === undefined) {
                valid_status = false;
            } else {
                try {
                    this.cleaned_data[field] = this.fields[field].clean(this.data[field]);
                } catch (e) {
                    if (e instanceof FormValidationError) {
                        validation_error(field, e.message);
                    } else {
                        throw(e);
                    }
                }
            }
        }
    }

    return valid_status;
};
Form.prototype.toString = function () {
    return "[object reform.Form]";
};
Form.prototype.toHtml = function (tag_style) {
    tag_style = tag_style || "li";
    var parts = [];
    // If it is not bound we don't want to try to validate it.
    var is_valid = this.is_bound ? this.is_valid() : true;
    for (field in this.fields) {
        if (!is_valid && this.errors[field] !== undefined) {
            parts.push(_simple_render("<((tag))>((error))</((tag))>", {
                                         tag: tag_style,
                                         error: this.errors[field]
                                     }));
        }
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