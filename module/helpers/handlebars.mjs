/* SKYFALL Handlebars */
export function registerHandlebarsHelpers() {
	Handlebars.registerHelper("ift", function (v, rtrue, rfalse) {
		return (v ? rtrue : rfalse);
	});

	Handlebars.registerHelper("ifnull", function (rtrue, rnull) {
		return rtrue ?? rnull;
	});

	Handlebars.registerHelper("iftrue", function (rtrue, rfalse) {
		return rtrue || rfalse;
	});

	Handlebars.registerHelper("includes", function (v, choices=[]) {
		return choices.includes(v);
	});
}