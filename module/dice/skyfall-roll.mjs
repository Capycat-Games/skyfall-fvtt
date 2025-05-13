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
	constructor(formula, data, options = {type:'check'}) {
		super(formula, data, options);
		this.original = formula;
	}
	
	static fromItemRoll(itemRoll, data = {}, options = {}){
		const terms = [];

		options.flavor = game.i18n.localize(`SKYFALL2.ROLL.${itemRoll.type.titleCase()}`);
		options.type = itemRoll.type;

		for (const term of itemRoll.terms) {
			terms.push(`${term.expression}[${term.flavor}|${term.data}|${term.source}]`);
		}
		return new this(terms.join(' + '), data, options);
	}

	static fromSkyfallTerms(terms=[], data = {}, options){
		const dataRgx = new RegExp(/@(?<data>[a-zA-Z.0-9_-]+)/i);
		const flavorRgx = new RegExp(/\[(?<flavor>[a-zA-Z.0-9_-|\s]+)\]/i);
		terms = terms.map( (term) => {
			let data = term.match(dataRgx)?.groups?.data ?? "";
			let flavor = term.match(flavorRgx)?.groups?.flavor ?? "";
			let arr = flavor.split('|');
			arr[0] ??= "";
			arr[1] ??= data ?? "";
			arr[2] ??= "";
			if ( !term.match(flavorRgx) ) {
				term = `${term}[${arr.join('|')}]`;
			} else {
				term = term.replace(flavorRgx, `[${arr.join('|')}]`);
			}
			return term;
		});
		return new this(terms.join(' + '), data, options);
	}

	get type(){
		if ( this.terms[0].faces == 20) return "d20";
		else return "damage";
	}
	get transformers(){
		let t = [];
		switch (this.options.type) {
			case "check": 					t = [''];
			case "ability": 				t = ['ability'];
			case "initiative": 			t = ['ability','initiative'];
			case "skill": 					t = ['ability','skill'];
			case "attack": 					t = ['ability','attack'];
			case "damage": 					t = ['damage'];
			case "deathsave": 			t = ['deathsave'];
			case "catharsis": 			t = ['catharsis'];
			// case "hitdieheal": 	t = ['hitdie'];
			// case "hitdie": 			t = ['hitdie'];
		}
		if ( this.options.ability ) t.push( this.options.ability );
		if ( this.options.skill ) t.push( this.options.skill );
		return t;
	}

	static TEMPLATE = "systems/skyfall/templates/apps/roll-config.hbs";


	async applyCatharsis({operator = '+'}){
		if ( this.evaluated ) return; //TODO NOTICE
		const catharsis = new RollSF(`1d6[catharsis${operator}]`);
		await catharsis.evaluate();
		const catTerm = this.terms.find( t => t.flavor == `catharsis${operator}` );
		if ( catTerm ){
			catTerm.number = catTerm.number + 1;
			catTerm.results = catTerm.results.concat( catharsis.terms[0].results );
		} else {
			this.terms = this.terms.concat([
				new _terms.OperatorTerm({operator: operator}),
				catharsis.terms[0]
			]);
		}
		this._formula = this.resetFormula(this.terms);
		this._formula = this._formula.replaceAll(/(\[\w*(\+|\-)?\])/g, '');
		try {
			if ( game.dice3d ) game.dice3d.showForRoll( catharsis, game.user, true, null, false, null, null);
				
		} catch (error) {
			
		}
		return this._evaluate();
	}

	async configureDialog(){
		return new RollConfig({roll: this}).render(true);
	}

	async _evaluate(options={}) {
		this.terms.forEach(term => {
			if( this.options.damageType && term.options && !term.options.flavor ) {
				term.options.flavor = this.options.damageType;
			}
		});
		await super._evaluate(options);
		return this;
	}

	/* ------------------------------ */
	/* Custom Alters                  */
	/* ------------------------------ */

	advantage(options={mod: 'kh', extra:false}){
		if ( this.terms[0]?.faces !== 20) return
		if ( !this.terms[0].modifiers.includes(options.mod) ){
			this.terms[0].modifiers.push(options.mod);
		}
		if ( options.extra ) this.terms[0].number += 1;
		else this.terms[0].number = Math.min(this.terms[0].number+1, 2);
		
		this.resetFormula();
	}

	
	/* ------------------------------ */
	/* Class Methods           */
	/* ------------------------------ */

	/** @overwrite */
	async render({flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false}={}) {
		// let html = await super.render(arguments)
		// html = html.replace('class="dice-roll"',`class="dice-roll ${this.type}"`);
		// return html;
		// if ( !this._evaluated ) await this.evaluate({allowInteractive: !isPrivate});
		const chatData = {
			SYSTEM: SYSTEM,
			roll: this,
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor ?? this.options.flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			total: isPrivate ? "?" : Math.round(this.total * 100) / 100
		};
		return renderTemplate(template, chatData);
	}

	/** @overwrite */
	async toMessage(messageData={}, {rollMode, create=true}={}) {
		if ( !messageData.flavor ) {
			messageData.flavor = skyfall.utils.rollTitle(this.options);
		}
		return super.toMessage(messageData, {rollMode, create});
	}

	/* ------------------------------ */
	/* Static Class Methods           */
	/* ------------------------------ */

	static parse(formula, data) {
		let terms = super.parse(formula, data);
		terms.forEach((t) => {
			if ( !t.options?.flavor ) return;
			let splited = t.options.flavor?.split('|') ?? ['','',''];
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
	static replaceFormulaDataV1(formula, data, {missing, warn=false}={}) {
		let dataRgx = new RegExp(/@([a-z.0-9_-]+)(\[(.*?)\])?/gi);
		formula = formula.replace(dataRgx, (match, term)=>{
			if ( !data[term] ) {
				return match;
			} else if ( !match.endsWith(']') ) {
				return match + `[%${term}]`
			} else {
				return match.replace(']', `%${term}]`)
			}
		});
		return super.replaceFormulaData(formula, data, {missing, warn})
	}
}