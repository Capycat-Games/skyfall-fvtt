/**
 * Data schema, attributes, and methods specific to Spell type Items.
 */
export default class GuildAbility extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			type: new fields.StringField({
				required: true,
				blank: true,
				choices: {
					cunning: {value:'cunning', label:"SKYFALL2.GUILD.Cunning"},
					knowledge: {value:'knowledge', label:"SKYFALL2.GUILD.Knowledge"},
					crafting: {value:'crafting', label:"SKYFALL2.GUILD.Crafting"},
					reputation: {value:'reputation', label:"SKYFALL2.GUILD.Reputation"},
				},
				initial: "cunning",
				label: "SKYFALL2.Ability"
			}),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL.DESCRIPTORS"})),
			activation: new fields.SchemaField({
				type: new fields.StringField({required: true, initial: 'action', label: "SKYFALL2.ACTIVATION.Type"}),
				cost: new fields.NumberField({required: true, label: "SKYFALL2.GUILD.GuildActionPl"}),
			}, {label: "SKYFALL2.Activation"}),
			effect: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
			}),
			special: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
			}),
			consume: new fields.SchemaField({
				amount: new fields.NumberField({required: true, integer: true, label: "SKYFALL2.Cost"}),
			}, {label: "SKYFALL2.Consume"})
		};
	}

	/* ---------------------------------------- */
	/*  GETTERS                                 */
	/* ---------------------------------------- */
	
	get action() {
		return this.activation.type;
	}

	get labels(){
		const labels = {};
		// ACTIVATION
		const actions = new Set(['action','bonus','reaction','free']);
		labels.action = {
			label: SYSTEM.activations[this.action].label,
			icon: actions.has(this.action) ? SYSTEM.icons[`sf${this.action}`] : SYSTEM.icons.sfmaction
		}
		// ICON
		labels.type = { icon: SYSTEM.icons[`sf${this.type}`] }
		// Actions Cost
		if ( this.activation.cost ) {
			labels.cost = this.activation.cost;
		}
		labels.properties = {};
		if ( this.consume.amount ) {
			labels.properties.cost = {
				label: "SKYFALL.ITEM.ABILITY.COST",
				descriptive: game.i18n.format('{value} {resource}', {
					value: this.consume.amount,
					resource: game.i18n.localize(`SKYFALL2.GUILD.${this.type.titleCase()}Points`),
				}),
			}
		} else {
			labels.properties.cost = {
				label: "SKYFALL.ITEM.ABILITY.COST",
				descriptive: game.i18n.localize('SKYFALL2.Special'),
			}
		}

		if ( this.effect.descriptive ) {
			labels.effect = {
				label: "SKYFALL.ITEM.ABILITY.EFFECT",
				descriptive: this.effect.descriptive,
			}
		} else {}

		if ( this.special.descriptive ) {
			labels.special = {
				label: "SKYFALL.ITEM.ABILITY.SPECIAL",
				descriptive: this.special.descriptive,
			}
		} else {}
		
		// Descriptors
		if ( this.descriptors.length ){
			labels.descriptors =  skyfall.utils.descriptorsTags(this.descriptors, {sigil: true});
		}
		return labels;
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		this.descriptors = ['guild', this.type]
	}

	/** @inheritDoc */
	prepareDerivedData() {
	}
	
	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */

	getRollData() {
		return {}
	}
}
