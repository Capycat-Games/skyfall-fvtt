import { SYSTEM } from "../config/system.mjs";

/**
 * A simple form to set actor movement speeds
 * @extends {DocumentSheet}
 */
export default class ActorTraits extends DocumentSheet {
	constructor(actor, target, options) {
		super(actor, options);
		this.actor = actor;
		this.target = target;
	}

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["skyfall"],
			width: 400,
			height: "auto"
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get title() {
		if ( this.target == "movement" ) {
			return game.i18n.format('SKYFALL.ACTOR.MOVEMENT', this.document.name);
		} else if ( this.target == "damage.taken" ) {
			return game.i18n.format('SKYFALL.ACTOR.MODIFIERS.DAMAGETAKEN', this.document.name);
		} else if ( this.target == "damage.dealt" ) {
			return game.i18n.format('SKYFALL.ACTOR.MODIFIERS.DAMAGEDEALT', this.document.name);
		} else if ( this.target == "languages" ) {
			return game.i18n.format('SKYFALL.ACTOR.LANGUAGES', this.document.name);
		} else if ( this.target == "proficiencies" ) {
			return game.i18n.format('SKYFALL.ACTOR.PROFICIENCIES', this.document.name);
		} else return game.i18n.format('SKYFALL.ACTOR.PROFICIENCIES', this.document.name);
	}

	/* -------------------------------------------- */

	get template() {
		let template;
		if ( this.target == "movement" ) template = "movement";
		else if ( this.target == "damage.taken" ) template = "modifiers-damage";
		else if ( this.target == "damage.dealt" ) template = "modifiers-damage";
		else if ( this.target == "languages" ) template = "languages";
		else if ( this.target == "proficiencies" ) template = "proficiencies";
		else template = "template";
		return `systems/skyfall/templates/apps/${template}.hbs`;
	}

	/* -------------------------------------------- */

	get source() {
		return foundry.utils.deepClone(this.document._source);
	}
	/* -------------------------------------------- */

	/** @override */
	getData(options) {
		const context = {
			target: this.target,
			SYSTEM
		}
		if ( this.target == "movement" ) this.#getMovement(context);
		else if ( this.target == "damage.taken" ) this.#getDamage(context);
		else if ( this.target == "damage.dealt" ) this.#getDamage(context);
		else if ( this.target == "languages" ) this.#getLanguages(context);
		else if ( this.target == "proficiencies" ) this.#getProficiencies(context);
		
		return context;
	}

	#getMovement( context ){
		context.movement = {};
		for ( let [key, value] of Object.entries(this.source.system.movement) ) {
			// context.movement[k]
			context.movement[key] = {
				value: Number( value ).toNearest(0.1) ?? 0,
				label: SYSTEM.movement[ key ].label,
			}
			//Number.isNumeric( value ) ? value.toNearest(0.1) : 0;
			// context.movement.hint = SYSTEM.movement[ key ].hint;
		}
	}

	#getDamage( context ){
		let schema = getProperty(this.document.system.modifiers, this.target);
		context.damageTypes = {};
		console.log(schema, this.target);
		for ( let [key, damage] of Object.entries(SYSTEM.DESCRIPTOR.DAMAGE) ) {
			context.damageTypes[key] = {
				taken: schema[key],
				dealt: schema[key],
				label: damage.label,
				abbr: damage.abbr,
			}
		}
	}

	#getLanguages( context ){
		context.languages = {};
		for ( let [key, idioma] of Object.entries(SYSTEM.languages) ) {
			context.languages[key] = {
				value: this.document.system.languages.includes(key),
				label: idioma.label 
			}
		}
	}

	#getProficiencies( context ){
		context.proficiencies = {};
		for ( let [key, proficiencies] of Object.entries({...SYSTEM.weapons, ...SYSTEM.armors}) ) {
			context.proficiencies[key] = {
				value: this.document.system.proficiencies.includes(key),
				label: proficiencies.label
			}
		}
	}

	/** @inheritdoc */
	async _updateObject(event, formData) {
		if ( formData['system.languages'] ) formData['system.languages'] = formData['system.languages'].filter(Boolean);
		if ( formData['system.proficiencies'] ) formData['system.proficiencies'] = formData['system.proficiencies'].filter(Boolean);
		console.log( event, formData );
		return super._updateObject(event, formData);
	}
}
