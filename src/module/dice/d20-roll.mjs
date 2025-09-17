const { renderTemplate } = foundry.applications.handlebars;
import SkyfallRoll from "./skyfall-roll.mjs";
const _terms = foundry.dice.terms;
/**
 * A type of Roll specific to a d20-based check
 * @param {string} formula                       The string formula to parse
 * @param {object} data                          The data object against which to parse attributes within the formula
 * @param {object} [options={}]                  Extra optional arguments which describe or modify the D20Roll
 * @param {number} [options.advantage]           Amount of dice rolled with advantage
 * @param {number} [options.disadvantage]        Amount of dice rolled with disadvantage
 * @param {number} [options.critical]            The value of d20 result which represents a critical success
 * @param {number} [options.fumble]              The value of d20 result which represents a critical failure
 * @param {(number)} [options.targetValue]       Assign a target value against which the result of this roll should be compared
 * 
 */
export default class D20Roll extends SkyfallRoll {
	constructor(formula, data, options) {
		super(formula, data, options);
		this.original = formula;
		this.configureRoll();
	}

	static fromConfig({ terms = [], rollData = {}, types = [], advantage = 0, disadvantage = 0 }) {
		terms = terms.reduce((acc, t) => {
			let r = new RollSF(`${t.term}`, rollData);
			r.terms[0].options = t.options;
			r.terms.push(new _terms.OperatorTerm({ operator: '+' }));
			acc = acc.concat(r.terms);
			return acc;
		}, []);
		terms.pop();

		const roll = new this('', rollData, {
			types, advantage, disadvantage,
		});
		roll.terms = terms;

		return roll;
	}

	static fromItemRoll(itemRoll, data = {}, options = {}) {
		if (itemRoll.terms[0]?.faces != 20) {
			// itemRoll.terms.unshift({
			// 	expression: '1d20', flavor: '', data: '', source: 'd20'
			// });

		}
		const roll = super.fromItemRoll(itemRoll, data, options);
		roll.terms.unshift(new _terms.OperatorTerm({ operator: "+" }));
		roll.terms.unshift(new _terms.Die({ faces: 20, number: 1, options: { source: 'd20' } }));
		// Re-compile the underlying formula
		roll._formula = roll.constructor.getFormula(roll.terms);
		return roll;
	}
	/**
	 * Does this roll start with a d20?
	 * @type {boolean}
	 */
	get validD20Roll() {
		return (this.terms[0] instanceof foundry.dice.terms.Die) && (this.terms[0].faces === 20);
	}

	static TEMPLATE = "systems/skyfall/templates/apps/roll-config.hbs";


	async configureDialog({ title, type, ability = 'str', options }) {
		return console.error("deprecated");
		// Render the Dialog inner HTML
		const content = await renderTemplate(this.constructor.TEMPLATE, {
			title: title,
			rolltype: type,
			formula: `${this.formula} + @bonus`,
			ability: ability,
			bonus: '',
			advantage: 0,
			disadvantage: 0,
			defaultRollMode: game.settings.get("core", "rollMode"),
			SYSTEM
		});
		// Create the Dialog window and await submission of the form
		return new Promise(resolve => {
			new Dialog({
				title,
				content,
				buttons: {
					submit: {
						label: game.i18n.localize("SKYFALL.SHEET.SUBMIT"),
						callback: html => resolve(this._onDialogSubmit(html))
					}
				},
				default: 'submit',
			}, options).render(true);
		});
	}

	_onDialogSubmit(html) {
		const form = html[0].querySelector("form");

		// Append a situational bonus term
		if (form.bonus.value) {
			const bonus = new RollSF(form.bonus.value, this.data);
			if (!(bonus.terms[0] instanceof OperatorTerm)) this.terms.push(new OperatorTerm({ operator: "+" }));
			this.terms = this.terms.concat(bonus.terms);
		}

		// Customize the ability
		if (form.ability?.value) {
			const abl = this.data[form.ability.value];
			// if ( abl ) this.data['mod'] = abl;
			if (abl) this.terms[2].number = Number(abl);
		}

		// Customize advantage/disadvantage dice
		if (form.advantage?.value) this.options.advantage += Number(form.advantage.value);
		if (form.disadvantage?.value) this.options.disadvantage += Number(form.disadvantage.value);

		if (form.rollMode?.value) this.options.rollMode = form.rollMode.value;

		this.configureRoll();
		return this;
	}


	configureRoll() {
		if (!this.validD20Roll) return;
		const d20 = this.terms[0];
		d20.modifiers = [];

		const advDice = 0 + Number(this.options.advantage) - Number(this.options.disadvantage);
		if (advDice > 0) d20.modifiers.push('kh');
		else if (advDice < 0) d20.modifiers.push('kl');
		d20.number = 1 + (Math.abs(advDice) > 0 ? 1 : 0);//Math.abs(advDice);

		// Re-compile the underlying formula
		this._formula = this.constructor.getFormula(this.terms);
	}

	async testRoll() {
		let r = new CONFIG.Dice.rolls[1]("1d20 + @mod", { mod: 2, str: 2, cha: 5 }, { type: 'ability', ability: 'str', advantage: 2, disadvantage: 1 })
		await r.configureDialog({ title: "X", type: "ability", ability: "str" });
		await r.evaluate({ async: true });
		r.toMessage()
	}
}