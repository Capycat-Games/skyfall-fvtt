/* SKYFALL Handlebars */
export function registerHandlebarsHelpers() {
	Handlebars.registerHelper("toArray", function (...values) {
		const options = values.pop();
		return values;
	});

	Handlebars.registerHelper("toObject", function (...values) {
		const options = values.pop();
		return values.reduce( ( arr , value) => {
			let entry = value.split(':');
			arr[entry[0]] = entry[1];
			return arr;
		}, {});
	});

	Handlebars.registerHelper("isDefined", function (value) {
		return ( value !== undefined );
	});

	Handlebars.registerHelper("ifnull", function (rtrue, rnull) {
		return rtrue ?? rnull;
	});

	Handlebars.registerHelper("iftrue", function (rtrue, rfalse) {
		return rtrue || rfalse;
	});

	//Handlebars.registerHelper("includes", function (v, choices=[]) {
	Handlebars.registerHelper("includes", function (...values) {
		const options = values.pop();
		let search = values.pop();
		values = values.flat();
		return values.includes(search) === true;
	});
}