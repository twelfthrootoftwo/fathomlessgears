export function initialiseHelpers() {
	registerLogicalExpressions();
	registerSwitch();
}

function registerLogicalExpressions() {
	Handlebars.registerHelper("ifcond", function (v1, operator, v2, options) {
		switch (operator) {
			case "==":
				return v1 == v2 ? options.fn(this) : options.inverse(this);
			case "===":
				return v1 === v2 ? options.fn(this) : options.inverse(this);
			case "!=":
				return v1 != v2 ? options.fn(this) : options.inverse(this);
			case "!==":
				return v1 !== v2 ? options.fn(this) : options.inverse(this);
			case "<":
				return v1 < v2 ? options.fn(this) : options.inverse(this);
			case "<=":
				return v1 <= v2 ? options.fn(this) : options.inverse(this);
			case ">":
				return v1 > v2 ? options.fn(this) : options.inverse(this);
			case ">=":
				return v1 >= v2 ? options.fn(this) : options.inverse(this);
			case "&&":
				return v1 && v2 ? options.fn(this) : options.inverse(this);
			case "||":
				return v1 || v2 ? options.fn(this) : options.inverse(this);
			default:
				return options.inverse(this);
		}
	});
}

function registerSwitch() {
	Handlebars.registerHelper("switch", function (value, options) {
		this.switch_value = value;
		return options.fn(this);
	});

	Handlebars.registerHelper("case", function (value, options) {
		if (value == this.switch_value) {
			return options.fn(this);
		}
	});
}
