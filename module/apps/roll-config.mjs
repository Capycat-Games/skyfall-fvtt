// import RollConfiguration from "../data/other/roll-config.mjs";
import SkyfallRoll from "../dice/skyfall-roll.mjs";

const {HandlebarsApplicationMixin, ApplicationV2, DialogV2} = foundry.applications.api;

export default class RollConfig extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(options={}) {
		super(options);
		this.system = new skyfall.models.other.RollConfiguration({rollMode:game.settings.get("core", "rollMode")});
		this._reset(options);
		if ( options.skipConfig ) this._roll();
	}

	_reset(options){
		this.actor ??= options.actor ?? game.canvas.tokens.controlled[0]?.actor ?? null;
		this.target = this._getTarget();
		this.message ??= options.message ? game.messages.get(options.message) : null;
		this.rollData = options.rollData ?? this.actor.getRollData() ?? {};
		this._configFromRequest(options);
		this.ability = SYSTEM.abilities[this.config.ability] ?? null;
		this.skill = SYSTEM.skills[this.config.skill] ?? null;
		this._prepareTerms(options);
		this._prepareTransforms(options);
	}

	_configFromRoll(roll){
		this.config = {
			type: roll.options.type,
			ability: roll.options.ability,
			skill: roll.options.skill,
			formula: roll.formula,
		}
	}

	_configFromRequest( options ){
		// if ( foundry.utils.getType(options.ability) == 'string' ) {
		// 	this.rollData['mod'] = 5 ?? Number(options.ability) ?? `${options.ability}`;
		// 	options.ability = `@mod`;
		// }
		this.config = {
			type: options.type,
			ability: options.ability,
			skill: options.skill,
			formula: options.formula,
			protection: options.protection,
			rollIndex: options.rollIndex,
		}
	}

	_prepareTerms(){
		if ( ['damage','catharsis'].includes(this.config.type) ) {
			this.config.formula = this.config.formula.replace('-','+-');
			this.config.formula.split('+').reduce((acc, term) => {
				let t = new RollSF(term).terms[0];
				acc.push({
					expression: t.options.data ? `@${t.options.data}` : t.expression,
					label:`Base`,
					flavor: t.flavor,
					options: {
						flavor: t.flavor,
					},
					preview: this.rollData[t.options.data] ?? '',
					//this.actor.getRollData()[t.options.data] ?? '',
					active: true,
				});
				return acc;
			}, this.system.terms);
		} else {
			// this.terms.push({expression:'1d20',label:'d20',flavor:'d20'});
			if ( this.ability?.id ){
				this.system.terms.push({
					expression:`@${this.ability.id}`,
					label:`${this.ability.label}`,
					flavor:'ability',
					preview: this.rollData[this.ability.id] ?? 0,
					//this.actor.getRollData()[this.ability.id] ?? 0,
					active: true,
				});
			} else if ( this.config.ability == "@mod" ) {
				this.system.terms.push({
					expression:`@mod`,
					label: `Modificador`,
					flavor: 'ability',
					preview: this.rollData['mod'] ?? 0,
					//this.actor.getRollData()[this.ability.id] ?? 0,
					active: true,
				});
			}
			if ( this.skill ){
				this.system.terms.push({
					expression: `@${this.skill.id}`,
					label:`${this.skill.label}`,
					flavor:'proficiency',
					preview: this.rollData[this.skill.id] ?? 0,
					//this.actor.getRollData()[this.skill.id] ?? 0,
					active: true,
				});
			}
			if ( this.config.type == "attack" ){
				this.system.terms.push({
					expression: `@prof`,
					label:`Proficiência`,
					flavor:'proficiency',
					preview: this.rollData['prof'] ?? 0,
					//this.actor.getRollData()['prof'] ?? 0,
					active: true,
				});
			}
		}
	}

	_prepareTransforms(){
		const keep = this._hasKeep();
		if ( ['catharsis'].includes(this.config.type) ) {

		} else if ( ['damage'].includes(this.config.type) ) {
			this.system.transformers.push({
				label: "Crítico",
				expression: ["d*2"], //"critical",
				target: "d",
				active: false,
			});
		} else {
			this.system.transformers.push({
				label: "Desvantagem",
				expression: "disadvantage", //["1d","kl"],
				target: "d20",
				active: keep == -1 ? true : false,
				source: null,
			});
			this.system.transformers.push({
				label: "Vantagem",
				expression: "advantage",//["1d","kh"],
				target: "d20",
				active: keep == 1 ? true : false,
				source: null,
			});
			this.system.transformers.push({
				label: "Dado Extra Vantagem",
				expression: "advantage+", //["1d","kh"],
				target: "d20",
				active: false,
				source: "Precisão Vantajosa"
			});
		}
	}

	_hasKeep(){
		let result =  0;
		const rollMods = foundry.utils.getProperty(this.actor, `system.modifiers.roll.${this.config.type}`) ?? [];
		const statuses = this.target?.statuses ?? new Set();
		
		// KEYUP
		result += this.options.advantageConfig ? this.options.advantageConfig : 0;
		result += rollMods.includes("kh") ? 1 : 0;
		result += rollMods.includes("kl") ? -1 : 0;
		if ( this.config.protection ) {
			result += statuses.has( `protected-${this.config.protection}` ) ? -1 : 0;
			result += statuses.has( `protected-all` ) ? -1 : 0;
			result += statuses.has( `unprotected-${this.config.protection}` ) ? 1 : 0;
			result += statuses.has( `unprotected-all` ) ? 1 : 0;
			if ( ["str","dex","con"].includes(this.config.protection) ) {
				result += statuses.has( `protected-physical` ) ? -1 : 0;
				result += statuses.has( `unprotected-physical` ) ? 1 : 0;
			} else if ( ["int","wis","cha"].includes(this.config.protection) ) {
				result += statuses.has( `protected-mental` ) ? -1 : 0;
				result += statuses.has( `unprotected-mental` ) ? 1 : 0;
			}
		}
		return Math.clamp(-1, result , 1);
	}

	static DEFAULT_OPTIONS = {
		classes: ["skyfall","roll-config"],
		sheetConfig: false,
		tag: "form",
		form: {
			handler: RollConfig.#onSubmit,
			submitOnChange: false,
		},
		position: {
			width: 400,
		},
		actions: {
			roll: RollConfig.#onRoll,
			check: RollConfig.#onCheck,
			addTerm: RollConfig.#onAddTerm,
			deleteTerm: RollConfig.#onDeleteTerm,
			addModifier: RollConfig.#onAddModifier,
			deleteModifier: RollConfig.#onDeleteModifier,
			reset: RollConfig.#onReset,
		}
	}

	system;
	config = {type: null, ability: null, skill:null, formula:null, rollIndex:null};
	ability;
	skill;
	actor;
	message;

	/** @override */
	static PARTS = {
		form: {
			template: "systems/skyfall/templates/v2/apps/roll-config.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};

	/** @override */
	get title() {
		return game.i18n.localize("SKYFALL2.APP.RollConfig");
	}
	
	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		options.parts = ["form", "footer"];
	}

	/** @override */
	async _prepareContext(_options={}) {
		const context = {
			SYSTEM: SYSTEM,
			terms: this.system.terms,
			transformers: this.system.transformers,
			title: skyfall.utils.rollTitle(this.config),
			target: this.target, //_getTarget(),
			protection: (this.config.protection ? SYSTEM.abilities[this.config.protection].abbr : null),
			rollMode: this.system.rollMode,
			system: this.system,
			_app: {
				fields: foundry.applications.fields,
				element: foundry.applications.elements
			},
			_selOptions: {
				rollModes: Object.entries(CONFIG.Dice.rollModes).map(([k, v]) => ({
					group: "CHAT.RollDefault",
					value: k,
					label: v
				})),
			},
			buttons: [
				{type: "button", action:"roll", icon: "fas fa-check", label: "SKYFALL2.Confirm"}
			]
		}
		console.log(context);
		return context;
	}

	_getTarget(){
		const token = game.user.targets.first();
		if ( !token ) return null;
		const target = {}
		target.name = token.name;
		target.statuses = token.actor.statuses;
		// target.transformers = target.statuses.map( t => SYSTEM.rollTransformers[t] ).filter(Boolean);
		return target

		const targets = game.user.targets.reduce( acc, t => acc.push({name:t.name, statuses: t.actor.statuses}),[]);
		for (const token of targets) {
			token.actor.statuses
		}
	}
	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */

	static #onAddTerm (event, target) {
		const label = target.closest('li').querySelector('input[name=label]');
		const expression = target.closest('li').querySelector('input[name=expression]');
		const flavor = target.closest('li').querySelector('input[name=flavor]');
		this.system.terms.push({
			label: label.value ?? "",
			expression: expression.value ?? "",
			flavor: flavor.value ?? "",
			active: true
		});
		this.render();
	}

	static #onDeleteTerm (event, target) {
		this.system.terms.splice(target.dataset.delete, 1);
		this.render();
	}
	static #onAddModifier (event, target) {

	}
	static #onDeleteModifier (event, target) {
		this.system.transformers.splice(target.dataset.delete, 1);
		this.render();
	}

	static #onCheck(event, target){
		if ( !foundry.utils.hasProperty(this.system, target.name) ) return;
		const prop = foundry.utils.getProperty(this.system, target.name);
		foundry.utils.setProperty(this.system, target.name, !prop);
		this.render();
	}

	static #onRoll(event, target) {
		const rollMode = target.closest('form').querySelector('select[name=rollMode]');
		this.system.rollMode = rollMode.value;
		this._roll();
		this.close();
	}
	
	async _roll(){
		// this.config.type
		let roll;
		if ( ['damage'].includes(this.config.type) ) {
			roll = new RollSF([
				...this.system.terms.filter(t => t.active )
			].map(t => `${t.expression}${t.options?.flavor?'['+t.options.flavor+']':''}`).join('+'), this.rollData, this.config);
			// this.actor.getRollData()
			// TODO APPLY TRANSFORMERS
			const trns = this.system.transformers.filter(t => t.active );
			for (const transformer of trns) {
				if ( transformer.expression == "d*2" ) roll.alter(2);
			}
		} else if ( ['catharsis'].includes(this.config.type) ) {
			roll = new RollSF([
				...this.system.terms.filter(t => t.active )
			].map(t => t.expression ).join('+'), this.rollData, this.config);
		
		} else {
			roll = new RollSF([
				{expression:"1d20"},
				...this.system.terms.filter(t => t.active )
			].map(t => t.expression).join('+'), this.rollData, this.config);
			// this.actor.getRollData()
			// TODO APPLY TRANSFORMERS
			const trns = this.system.transformers.filter(t => t.active );
			for (const transformer of trns) {
	
				if ( transformer.expression == "disadvantage" ) roll.advantage({mod:"kl"})
				else if ( transformer.expression == "advantage" ) {
					roll.advantage({mod:"kh"});
					if ( transformer.expression == "advantage+" ) roll.advantage({mod:"kh",extra:true});
				}
			}
		}
		// Initiative
		if ( this.config.type == 'initiative') {
			try {
				roll.options.flavor = skyfall.utils.rollTitle(this.config);
				await roll.evaluate();
				roll.toMessage({}, {rollMode: this.system.rollMode});
				let combat = game.combats.active;
				if (!combat) return;
				let combatant = combat.combatants.find(
					(c) => c.actor.id === this.actor.id
				);
				if ( !combatant || combatant.initiative != null ) return;
				combat.setInitiative(combatant.id, roll.total);
				console.log(`Foundry VTT | Iniciativa Atualizada para ${combatant._id} (${combatant.actor.name})`);
			} catch (error) {
				console.warn(`Foundry VTT | Erro ao adicionar a Iniciativa, ${combatant._id} (${combatant.actor.name})`);
			}
		}
		else if ( this.message?.type == 'usage' && this.config.rollIndex !== null ) { //this.message?.type == 'usage' && 
			// TODO Evaluate and ADD to a existing message;
			roll.options.flavor = skyfall.utils.rollTitle(this.config);
			await roll.evaluate();
			this.message._updateRoll(roll, this.config.rollIndex);
			return;
		} else if ( this.options.createMessage ) roll.toMessage({}, {rollMode: this.system.rollMode});
		return roll;
	}

	static #onReset (event, target) {
		this._reset(this.options);
	}

	static async #onSubmit(event, form, formData) {
		let updateSource = formData.object;
		updateSource = foundry.utils.mergeObject(updateSource, foundry.utils.flattenObject(this.system.toObject()));
		
		this.system.updateSource(updateSource);
		this.render();
		return;
	}
}