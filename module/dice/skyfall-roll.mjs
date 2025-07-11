const { Coin, DiceTerm, Die, FunctionTerm, NumericTerm, OperatorTerm, ParentheticalTerm, RollTerm } =
	foundry.dice.terms;
const { renderTemplate } = foundry.applications.handlebars;
import RollConfig from "../apps/roll-config.mjs";

const _terms = foundry.dice.terms;
/**
 * A type of roll specific to Skyfall RPG
 * TODOS:
 * - TAGS. A way of identify a roll and retrieve applicable modifiers.
 * @TAG check                            A D20 Roll
 * @TAG ability, skill, attack           Check context
 * @TAG damage                           Damage Roll
 * @TAG catharsis                        A d6 added to a fulfilled roll
 */

export default class SkyfallRoll extends Roll {
	constructor(formula, data, options = { type: 'check' }) {
		super(formula, data, options);
		this.original = formula;
	}

	static fromItemRoll(itemRoll, data = {}, options = {}) {
		const terms = [];

		options.flavor = game.i18n.localize(`SKYFALL2.ROLL.${itemRoll.type.titleCase()}`);
		options.type = itemRoll.type;

		for (const term of itemRoll.terms) {
			terms.push(`${term.expression}[${term.flavor}|${term.data}|${term.source}]`);
		}
		return new this(terms.join(' + '), data, options);
	}

	static fromSkyfallTerms(terms = [], data = {}, options) {
		const dataRgx = new RegExp(/@(?<data>[a-zA-Z.0-9_-]+)/i);
		const flavorRgx = new RegExp(/\[(?<flavor>[a-zA-Z.0-9_-|\s]+)\]/i);
		terms = terms.map((term) => {
			let data = term.match(dataRgx)?.groups?.data ?? "";
			let flavor = term.match(flavorRgx)?.groups?.flavor ?? "";
			let arr = flavor.split('|');
			arr[0] ??= "";
			arr[1] ??= data ?? "";
			arr[2] ??= "";
			if (!term.match(flavorRgx)) {
				term = `${term}[${arr.join('|')}]`;
			} else {
				term = term.replace(flavorRgx, `[${arr.join('|')}]`);
			}
			return term;
		});
		return new this(terms.join(' + '), data, options);
	}

	get type() {
		if (this.terms[0].faces == 20) return "d20";
		else return "damage";
	}
	get transformers() {
		let t = [];
		switch (this.options.type) {
			case "check": t = [''];
			case "ability": t = ['ability'];
			case "initiative": t = ['ability', 'initiative'];
			case "skill": t = ['ability', 'skill'];
			case "attack": t = ['ability', 'attack'];
			case "damage": t = ['damage'];
			case "deathsave": t = ['deathsave'];
			case "catharsis": t = ['catharsis'];
			// case "hitdieheal": 	t = ['hitdie'];
			// case "hitdie": 			t = ['hitdie'];
		}
		if (this.options.ability) t.push(this.options.ability);
		if (this.options.skill) t.push(this.options.skill);
		return t;
	}

	static TEMPLATE = "systems/skyfall/templates/apps/roll-config.hbs";


	async applyCatharsis({ operator = '+' }) {
		if (this.evaluated) return; //TODO NOTICE
		const catharsis = new RollSF(`1d6[catharsis${operator}]`);
		await catharsis.evaluate();
		const catTerm = this.terms.find(t => t.flavor == `catharsis${operator}`);
		if (catTerm) {
			catTerm.number = catTerm.number + 1;
			catTerm.results = catTerm.results.concat(catharsis.terms[0].results);
		} else {
			this.terms = this.terms.concat([
				new _terms.OperatorTerm({ operator: operator }),
				catharsis.terms[0]
			]);
		}
		this._formula = this.resetFormula(this.terms);
		this._formula = this._formula.replaceAll(/(\[\w*(\+|\-)?\])/g, '');
		try {
			if (game.dice3d) game.dice3d.showForRoll(catharsis, game.user, true, null, false, null, null);

		} catch (error) {

		}
		return this._evaluate();
	}

	async configureDialog() {
		return new RollConfig({ roll: this }).render(true);
	}

	async _evaluate(options = {}) {
		this.terms.forEach(term => {
			if (this.options.damageType && term.options && !term.options.flavor) {
				term.options.flavor = this.options.damageType;
			}
		});
		await super._evaluate(options);
		return this;
	}

	/* ------------------------------ */
	/* Custom Alters                  */
	/* ------------------------------ */

	advantage(options = { mod: 'kh', extra: false }) {
		if (this.terms[0]?.faces !== 20) return
		if (!this.terms[0].modifiers.includes(options.mod)) {
			this.terms[0].modifiers.push(options.mod);
		}
		if (options.extra) this.terms[0].number += 1;
		else this.terms[0].number = Math.min(this.terms[0].number + 1, 2);

		this.resetFormula();
	}


	/* ------------------------------ */
	/* Class Methods           */
	/* ------------------------------ */

	/** @overwrite */
	async render({ flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false } = {}) {
		// let html = await super.render(arguments)
		// html = html.replace('class="dice-roll"',`class="dice-roll ${this.type}"`);
		// return html;
		// if ( !this._evaluated ) await this.evaluate({allowInteractive: !isPrivate});
		const renderFormula = this.simplifyRollFormula();
		const chatData = {
			SYSTEM: SYSTEM,
			roll: this,
			formula: isPrivate ? "???" : renderFormula, //this._formula,
			flavor: isPrivate ? null : flavor ?? this.options.flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			total: isPrivate ? "?" : Math.round(this.total * 100) / 100
		};
		return renderTemplate(template, chatData);
	}

	/** @overwrite */
	async toMessage(messageData = {}, { rollMode, create = true } = {}) {
		if (!messageData.flavor) {
			messageData.flavor = skyfall.utils.rollTitle(this.options);
		}
		return super.toMessage(messageData, { rollMode, create });
	}

	/* ------------------------------ */
	/* Static Class Methods           */
	/* ------------------------------ */

	static parse(formula, data) {
		let terms = super.parse(formula, data);
		terms.forEach((t) => {
			if (!t.options?.flavor) return;
			let splited = t.options.flavor?.split('|') ?? ['', '', ''];
			t.options.flavor = splited[0] ?? '';
			t.options.data = splited[1] ?? '';
			t.options.source = splited[2] ?? '';
		});
		return terms;
	}
	/**
	 * Replace referenced data attributes in the roll formula with values from the provided data.
	 * Data references in the formula use the @attr syntax and would reference the corresponding attr key.
	 *
	 * @param {string} formula          The original formula within which to replace
	 * @param {object} data             The data object which provides replacements
	 * @param {object} [options]        Options which modify formula replacement
	 * @param {string} [options.missing]      The value that should be assigned to any unmatched keys.
	 *                                        If null, the unmatched key is left as-is.
	 * @param {boolean} [options.warn=false]  Display a warning notification when encountering an un-matched key.
	 * @static
	 */
	static replaceFormulaDataV1(formula, data, { missing, warn = false } = {}) {
		let dataRgx = new RegExp(/@([a-z.0-9_-]+)(\[(.*?)\])?/gi);
		formula = formula.replace(dataRgx, (match, term) => {
			if (!data[term]) {
				return match;
			} else if (!match.endsWith(']')) {
				return match + `[%${term}]`
			} else {
				return match.replace(']', `%${term}]`)
			}
		});
		return super.replaceFormulaData(formula, data, { missing, warn })
	}




	/**
	 * Minimize Roll formula for exibition, mergin dice and adding deterministic values
	 * @param {string} formula                          The original roll formula.
	 * @param {object} [options]                        Formatting options.
	 *
	 * @returns {string}  The resulting simplified formula.
	 */
	simplifyRollFormula() {
		// Create a new roll and verify that the formula is valid before attempting simplification.
		let roll;
		try {
			roll = new Roll(this._formula, this.data);
		} catch (err) {
			console.warn(`Unable to simplify formula '${formula}': ${err}`);
			return;
		}
		Roll.validate(roll.formula);

		roll.terms = Roll.parse(roll.formula.replace(RollTerm.FLAVOR_REGEXP, ""));

		// Perform arithmetic simplification on the existing roll terms.
		roll.terms = this._simplifyOperatorTerms(roll.terms);

		if (/[*/]/.test(roll.formula)) {
			if (roll.isDeterministic && !/d\(/.test(roll.formula) && (!/\[/.test(roll.formula))) {
				return String(new Roll(roll.formula).evaluateSync().total);
			}
			return roll.constructor.getFormula(roll.terms);
		}

		// Flatten the roll formula and eliminate string terms.
		roll.terms = this._expandParentheticalTerms(roll.terms);
		roll.terms = Roll.simplifyTerms(roll.terms);

		// Group terms by type and perform simplifications on various types of roll term.
		let { poolTerms, diceTerms, mathTerms, numericTerms } = this._groupTermsByType(roll.terms);
		numericTerms = this._simplifyNumericTerms(numericTerms ?? []);
		diceTerms = this._simplifyDiceTerms(diceTerms ?? []);

		// Recombine the terms into a single term array and remove an initial + operator if present.
		const simplifiedTerms = [diceTerms, poolTerms, mathTerms, numericTerms].flat().filter(Boolean);
		if (simplifiedTerms[0]?.operator === "+") simplifiedTerms.shift();
		return roll.constructor.getFormula(simplifiedTerms);
	}

	/* -------------------------------------------- */

	/**
	 * A helper function to perform arithmetic simplification and remove redundant operator terms.
	 * @param {RollTerm[]} terms  An array of roll terms.
	 * @returns {RollTerm[]}      A new array of roll terms with redundant operators removed.
	 */
	_simplifyOperatorTerms(terms) {
		return terms.reduce((acc, term) => {
			const prior = acc[acc.length - 1];
			const ops = new Set([prior?.operator, term.operator]);

			// If one of the terms is not an operator, add the current term as is.
			if (ops.has(undefined)) acc.push(term);
			// Replace consecutive "+ -" operators with a "-" operator.
			else if (ops.has("+") && ops.has("-")) acc.splice(-1, 1, new OperatorTerm({ operator: "-" }));
			// Replace double "-" operators with a "+" operator.
			else if (ops.has("-") && ops.size === 1) acc.splice(-1, 1, new OperatorTerm({ operator: "+" }));
			// Don't include "+" operators that directly follow "+", "*", or "/". Otherwise, add the term as is.
			else if (!ops.has("+")) acc.push(term);

			return acc;
		}, []);
	}

	/* -------------------------------------------- */

	/**
	 * A helper function for combining unannotated numeric terms in an array into a single numeric term.
	 * @param {object[]} terms  An array of roll terms.
	 * @returns {object[]}      A new array of terms with unannotated numeric terms combined into one.
	 */
	_simplifyNumericTerms(terms) {
		const simplified = [];
		const { annotated, unannotated } = this._separateAnnotatedTerms(terms);

		// Combine the unannotated numerical bonuses into a single new NumericTerm.
		if (unannotated.length) {
			const staticBonus = Roll.safeEval(Roll.getFormula(unannotated));
			if (staticBonus === 0) return [...annotated];

			// If the staticBonus is greater than 0, add a "+" operator so the formula remains valid.
			if (staticBonus > 0) simplified.push(new OperatorTerm({ operator: "+" }));
			simplified.push(new NumericTerm({ number: staticBonus }));
		}
		return [...simplified, ...annotated];
	}


	/* -------------------------------------------- */

	/**
	 * A helper function to group dice of the same size and sign into single dice terms.
	 * @param {object[]} terms  An array of DiceTerms and associated OperatorTerms.
	 * @returns {object[]}      A new array of simplified dice terms.
	 */
	_simplifyDiceTerms(terms) {
		const { annotated, unannotated } = this._separateAnnotatedTerms(terms);

		// Split the unannotated terms into different die sizes and signs
		const diceQuantities = unannotated.reduce((obj, curr, i) => {
			if (curr instanceof OperatorTerm) return obj;
			const isCoin = curr.constructor?.name === "Coin";
			const face = isCoin ? "c" : curr.faces;
			const modifiers = isCoin ? "" : curr.modifiers.filterJoin("");
			const key = `${unannotated[i - 1].operator}${face}${modifiers}`;
			obj[key] ??= {};
			if (curr._number instanceof Roll && curr._number.isDeterministic) curr._number.evaluateSync();
			obj[key].number = (obj[key].number ?? 0) + curr.number;
			if (!isCoin) obj[key].modifiers = (obj[key].modifiers ?? []).concat(curr.modifiers);
			return obj;
		}, {});

		// Add new die and operator terms to simplified for each die size and sign
		const simplified = Object.entries(diceQuantities).flatMap(([key, { number, modifiers }]) => [
			new OperatorTerm({ operator: key.charAt(0) }),
			key.slice(1) === "c"
				? new Coin({ number: number })
				: new Die({ number, faces: parseInt(key.slice(1)), modifiers: [...new Set(modifiers)] })
		]);
		return [...simplified, ...annotated];
	}

	/* -------------------------------------------- */

	/**
	 * A helper function to extract the contents of parenthetical terms into their own terms.
	 * @param {object[]} terms  An array of roll terms.
	 * @returns {object[]}      A new array of terms with no parenthetical terms.
	 */
	_expandParentheticalTerms(terms) {
		terms = terms.reduce((acc, term) => {
			if (term instanceof ParentheticalTerm) {
				if (term.isDeterministic)
					term = new NumericTerm({
						number: Roll.safeEval(term.term)
					});
				else {
					const subterms = new Roll(term.term).terms;
					term = this._expandParentheticalTerms(subterms);
				}
			}
			acc.push(term);
			return acc;
		}, []);
		return this._simplifyOperatorTerms(terms.flat());
	}

	/* -------------------------------------------- */

	/**
	 * A helper function to group terms into PoolTerms, DiceTerms, MathTerms, and NumericTerms.
	 * MathTerms are included as NumericTerms if they are deterministic.
	 * @param {RollTerm[]} terms  An array of roll terms.
	 * @returns {object}          An object mapping term types to arrays containing roll terms of that type.
	 */
	_groupTermsByType(terms) {
		// Add an initial operator so that terms can be rearranged arbitrarily.
		if (!(terms[0] instanceof OperatorTerm)) terms.unshift(new OperatorTerm({ operator: "+" }));

		return terms.reduce((obj, term, i) => {
			let type;
			if (term instanceof DiceTerm) type = DiceTerm;
			else if (term instanceof FunctionTerm && term.isDeterministic) type = NumericTerm;
			else type = term.constructor;
			const key = `${type.name.charAt(0).toLowerCase()}${type.name.substring(1)}s`;

			// Push the term and the preceding OperatorTerm.
			(obj[key] = obj[key] ?? []).push(terms[i - 1], term);
			return obj;
		}, {});
	}

	/* -------------------------------------------- */

	/**
	 * A helper function to separate annotated terms from unannotated terms.
	 * @param {object[]} terms     An array of DiceTerms and associated OperatorTerms.
	 * @returns {Array | Array[]}  A pair of term arrays, one containing annotated terms.
	 */
	_separateAnnotatedTerms(terms) {
		return terms.reduce(
			(obj, curr, i) => {
				if (curr instanceof OperatorTerm) return obj;
				obj[curr.flavor ? "annotated" : "unannotated"].push(terms[i - 1], curr);
				return obj;
			},
			{ annotated: [], unannotated: [] }
		);
	}
}