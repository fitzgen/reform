var util = require("util");

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
BaseFormField.prototype.clean = function (data) {
    throw new Error("Not implemented");
};
BaseFormField.prototype.toString = function () {
    throw new Error("Not implemented");
};

function TextField (options) {
    util.update(this, options);
}
TextField.prototype.clean = function (data) {
    if (data.length > 0) {
        data = util.trim(data);
        if (data === "") {
            throw new FormValidationError();
        } else {
            return data;
        }
    } else if (this.required) {
        throw new FormValidationError("This field is required.");
    } else {
        return data;
    }
};
TextField.prototype.toString = function () {
    return ["<label for='id_", this.name, "'>", this.label, "</label> ",
            "<input type='text' id='id_", this.name, "' name='", this.name, "' value='", this.initial, "' />"].join("");
};
exports.TextField = TextField;


// FORMS

function Form(fields) {
    this.fields = fields;
    for (field in this.fields) {
        fields[field].name = field;
        if (fields[field].label === "") {
            // Generate a label as best we can. ("form_field" => "Form Field")
            fields[field].label = util.splitName(util.title(field)).join(" ");
        }
    }
}

Form.prototype.bind = function (data) {
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
    null;
};

exports.Form = Form;