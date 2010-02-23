var util = require("util");

var _safeNewWrap = function (fn) {
    var f = function (options) {
        if (!(this instanceof arguments.callee)) {
            return new arguments.callee(options);
        } else {
            fn.apply(this, arguments);
        }
    };
    f.prototype = new fn();
    return f;
};

var genericFieldConstructor = function (name) {
    return _safeNewWrap(function (options) {
                              util.update(this, options);
                              this._name = name;
                          });
};
exports.genericFieldConstructor = genericFieldConstructor;

// Simple helper templater for rendering forms to HTML
function _simpleRender(template, context) {
    return template.replace(/\(\([ ]*?([\w]+?)[ ]*?\)\)/gi,
                            function (wholeMatch, group) {
                                return context[group] || "";
                            });
}

// Generate a label as best we can. ("form_field" => "Form Field")
function _makeLabel(fieldName) {
    return util.splitName(util.title(fieldName)).join(" ");
}

function _clone(obj) {
    var F = function () {};
    F.prototype = obj;
    return new F();
}

// Throw this error inside a field's "clean" function to signal that the field
// did not validate.
var FormValidationError = _safeNewWrap(function (message) {
    this.message = message;
});
FormValidationError.prototype = new Error();
FormValidationError.prototype.name = "FormValidationError";
exports.FormValidationError = FormValidationError;

// FORM FIELDS

var BaseFormField = genericFieldConstructor("BaseFormField");
BaseFormField.prototype.required = true;
BaseFormField.prototype.label = "";
BaseFormField.prototype.helpText = "";
BaseFormField.prototype.initial = "";
BaseFormField.prototype.inputType = "text";
BaseFormField.prototype.prefix = "";
BaseFormField.prototype.clean = function (data) {
    throw new Error("Not implemented");
};
BaseFormField.prototype.toHtml = function (tagStyle) {
    return _simpleRender(this.template, {
        name: this.prefix + this.name,
        value: this.initial || "",
        inputType: this.inputType,
        tag: tagStyle || "li",
        helpText: this.helpText ?
            "<p class='form-help-text'>" + this.helpText + "</p>" :
            "",
        label: this.label,
        error: this.error === undefined ?
            "" :
            _simpleRender(this.errorTemplate, {
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
    '  ((helpText))',
    '  ((error))',
    '  <input type="((inputType))"',
    '         name="((name))"',
    '         id="id_((name))"',
    '         value="((value))" />',
    '</((tag))>'
].join("\n");
BaseFormField.prototype.errorTemplate = [
    '<p class="form-validation-error">',
    '  (( message ))',
    '</p>'
].join("");

var TextField = genericFieldConstructor("TextField");
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

var TextAreaField = genericFieldConstructor("TextAreaField");
TextAreaField.prototype = new TextField();
TextAreaField.prototype.template = [
    '<(( tag ))>',
    '  <label for="id_(( name ))">(( label ))</label>',
    '  (( helpText ))',
    '  (( error ))',
    '  <textarea id="id_(( name ))" name="(( name ))">(( value ))</textarea>',
    '</(( tag ))>'
].join("\n");
exports.TextAreaField = TextAreaField;

var EmailField = genericFieldConstructor("EmailField");
EmailField.prototype = new BaseFormField();
EmailField.prototype.toString = function () {
    return "[object reform.EmailField]";
};
EmailField.prototype.clean = function (data) {
    var emailRegexp = /^[\w\.\-]+?@[\w\-]+?(?:\.[\w\-]+)+?/i;
    data = util.trim(data);

    if (data === "") {
        if (this.required) {
            throw new FormValidationError("This field is required.");
        } else {
            return null;
        }
    } else {
        if (emailRegexp.exec(data) !== null) {
            return data;
        } else {
            throw new FormValidationError("Invalid email address.");
        }
    }
};
exports.EmailField = EmailField;

var PasswordField = genericFieldConstructor("PasswordField");
PasswordField.prototype = new TextField();
PasswordField.prototype.inputType = "password";
PasswordField.prototype.toString = function () {
    return "[object reform.PasswordField]";
};
exports.PasswordField = PasswordField;

var IntegerField = genericFieldConstructor("IntegerField");
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

Button = genericFieldConstructor("Button");
Button.prototype = new BaseFormField();
Button.prototype.inputType = "submit";
Button.prototype.label = "Submit";
Button.prototype.required = false;
Button.prototype.clean = function (data) {
    return data;
};
Button.prototype.template = [
    '<(( tag ))>',
    '  <input type="(( inputType ))"',
    '         name="(( name ))"',
    '         id="id_(( name ))"',
    '         value="(( label ))" />',
    '</(( tag ))>'
].join("\n");
exports.Button = Button;

var BaseChoiceField = genericFieldConstructor("BaseChoiceField");
BaseChoiceField.prototype = new BaseFormField();
BaseChoiceField.prototype.template = '(( choices ))';

var _choiceVal = function (choicePair) {
    return choicePair[0];
};
var _choiceLabel = function (choicePair) {
    return choicePair[1];
};
var _nthVal = function (choices, i) {
    return _choiceVal(choices[i]);
};
var _nthLabel = function (choices, i) {
    return _choiceLabel(choices[i]);
};

BaseChoiceField.prototype.toHtml = function (tagStyle) {
    var that = this;
    return _simpleRender(
        this.template, {
            choices: (function () {
                          var choices = [];
                          for (var i = 0; i < that.choices.length; i++) {
                              choices.push(_simpleRender(
                                               that.choiceTemplate, {
                                                   choiceVal: _nthVal(that.choices, i),
                                                   choiceLabel: _nthLabel(that.choices, i),
                                                   i: i,
                                                   name: that.prefix + that.name
                                               }
                                           ));
                          }
                          return choices.join("\n");
                      }()),
            name: this.prefix + this.name,
            label: this.label,
            helpText: this.helpText ?
                "<p class='form-help-text'>" + this.helpText + "</p>" :
                "",
            tag: tagStyle || "li",
            error: this.error === undefined ?
                "" :
                _simpleRender(this.errorTemplate, {
                    message: this.error
                })
        }
    );
};
BaseChoiceField.prototype.clean = function (data) {
    for (var i = 0; i < this.choices.length; i++) {
        if (data === _nthVal(this.choices, i)) {
            return data;
        }
    }
    if (this.required === true) {
        throw new FormValidationError("This field is required.");
    } else {
        return null;
    }
};

var RadioChoiceField = genericFieldConstructor("RadioChoiceField");
RadioChoiceField.prototype = new BaseChoiceField();
RadioChoiceField.prototype.toString = function () {
    return "[object reform.RadioChoiceField]";
};
RadioChoiceField.prototype.template = [
    '<(( tag ))>',
    '  <label>(( label ))</label>',
    '  (( helpText ))',
    '  (( error ))',
    '  <ul class="form-radio-list">',
    '    (( choices ))',
    '  </ul>',
    '</(( tag ))>'
].join("\n");
RadioChoiceField.prototype.choiceTemplate = [
    '<li>',
    '  <label for="id_(( name ))(( i ))">',
    '  <input id="id_(( name ))(( i ))"',
    '         type="radio"',
    '         name="(( name ))"',
    '         value="(( choiceVal ))" />',
    '  (( choiceLabel ))',
    '  </label>',
    '</li>'
].join("\n");
exports.RadioChoiceField = RadioChoiceField;

var DropdownField = genericFieldConstructor("DropdownField");
DropdownField.prototype = new BaseChoiceField();
DropdownField.prototype.toString = function () {
    return "[object reform.DropdownField]";
};
DropdownField.prototype.template = [
    '<(( tag ))>',
    '  <label for="id_(( name ))">(( label ))</label>',
    '  (( helpText ))',
    '  (( error ))',
    '  <select name="(( name ))" id="id_(( name ))">',
    '    (( choices ))',
    '  </select>',
    '</(( tag ))>'
].join("\n");
DropdownField.prototype.choiceTemplate = [
    '<option value="(( choiceVal ))">',
    '(( choiceLabel ))',
    '</option>'
].join("");
exports.DropdownField = DropdownField;

// FORMS

var Form = _safeNewWrap(function (fields) {
    var field;
    this.fields = fields;
    for (field in this.fields) {
        fields[field].name = field;
        if (fields[field].label === "") {
            fields[field].label = _makeLabel(field);
        }
    }
});

Form.prototype.bindData = function (data) {
    var field, fieldName;
    this.data = data;

    for (fieldName in data) {
        field = this.fields[fieldName.replace(this.prefix, "")];
        if (field instanceof BaseFormField) {
            field.initial = this.data[fieldName];
            this.isBound = true;
        }
    }

    return this;
};

Form.prototype.isValid = function () {
    var that = this;
    var validStatus = true;
    var field;

    var validationError = function (field, message) {
        if (that.errors === undefined) {
            that.errors = {};
        }
        that.errors[field] = message;
        that.fields[field].error = message;
        validStatus = false;
        return message;
    };

    if (that.isBound === true) {
        that.cleanedData = {};

        for (field in that.fields) {
            if (that.fields.hasOwnProperty(field)) {
                try {
                    that.cleanedData[field] = that.fields[field].clean(
                        that.data[that.prefix + field] || ""
                    );
                } catch (e) {
                    if (e instanceof FormValidationError) {
                        validationError(field, e.message);
                    } else {
                        throw e;
                    }
                }
            }
        }
    }

    return validStatus && that.isBound;
};
Form.prototype._name = "Form";
Form.prototype.isBound = false;
Form.prototype.prefix = "";
Form.prototype.toString = function () {
    return "[object reform." + this._name + "]";
};
Form.prototype.toHtml = function (tagStyle) {
    tagStyle = tagStyle || "li";
    var field;
    var parts = [];
    // If it is not bound we don't want to try to validate it.
    var isValid = this.isBound ? this.isValid() : true;
    for (field in this.fields) {
        parts.push(this.fields[field].toHtml(tagStyle));
    }
    return parts.join("\n");
};

// Create a clone of this form. Optionally, pass in data to be bound to the
// newly cloned form or a prefix.
Form.prototype.clone = function (/* data, prefix */) {
    var clone = _clone(this);
    var field;
    clone.fields = {};

    var data = typeof arguments[0] === "object" && arguments[0] !== null ?
        arguments[0] :
        false;
    var prefix = clone.prefix = arguments[1] || clone.prefix;

    for (field in this.fields) {
        clone.fields[field] = _clone(this.fields[field]);
        clone.fields[field].prefix = prefix;
    }

    if (data) {
        clone.bindData(data);
    }

    return clone;
};

exports.Form = Form;
