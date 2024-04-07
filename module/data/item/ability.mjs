import { SYSTEM } from "../../config/system.mjs";

/**
 * Data schema, attributes, and methods specific to Ancestry type Items.
 */
export default class Ability extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true}),
			}),
			origin: new fields.StringField({required: true}, {validate: Ability.validateUuid}),
			modification: new fields.SetField(new fields.StringField({required: true}, {validate: Ability.validateUuid})),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false})),

			activation: new fields.SchemaField({
				type: new fields.StringField({required: true, initial: 'action', label: "SKYFALL.ITEM.ACTIVATIONTYPE"}),
				cost: new fields.NumberField({required: true, label: "SKYFALL.ITEM.ACTIVATIONCOST"}),
				repeatable: new fields.BooleanField({label: "SKYFALL.ITEM.ABILITY.REPEATABLE"}),
				trigger: new fields.StringField({required: true, label: "SKYFALL.ITEM.ABILITY.TRIGGER"})
			}, {label: "SKYFALL.ITEM.ACTIVATION"}),
			
			duration: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true}),
				value: new fields.NumberField({required: true, integer: true, min: 0}),
				units: new fields.StringField({required: true, blank: true, choices: SYSTEM.durations, initial: ""}),
			}),
			target: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true}),
				type: new fields.StringField({required: true, blank: true, choices: SYSTEM.individualTargets, initial: ""}),
				quantity: new fields.NumberField({required: true, integer: true, min: 0}),
				shape: new fields.StringField({required: true, blank: true, choices: SYSTEM.areaTargets, initial: ""}),
				length: new fields.NumberField({required: true, blank: true, min: 0}),
				width: new fields.NumberField({required: true, blank: true, min: 0}),
				units: new fields.StringField({required: true, blank: true, choices: SYSTEM.movementUnits, initial: "m"}),
			}),
			range: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true}),
				value: new fields.NumberField({required: true, integer: true, min: 0}),
				units: new fields.StringField({required: true, blank: true, choices: SYSTEM.ranges, initial: "self"}),
			}),
			
			// PODE TER UM MULTIPLOS (ARRAY) ?
			attack: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true}),
				hit: new fields.StringField({required: true, blank: true}),
				miss: new fields.StringField({required: true, blank: true}),
				//Formula Variable @for, @des, @magico, @weaponName
				type: new fields.StringField({required: true, blank: true}),
				protection: new fields.StringField({required: true, blank: true, choices: SYSTEM.abilities }),
				damage: new fields.StringField({required: true, blank: true}),
			}),
			effect: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true}),
				damage: new fields.StringField({required: true, blank: true}),
			}),
			special: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true}),
			}),
			uses: new fields.SchemaField({
				value: new fields.NumberField({required: true, min: 0, integer: true, label: "SKYFALL.LimitedUsesAvailable"}),
				max: new fields.NumberField({required: true, integer: true, min: 0, label: "SKYFALL.LimitedUsesMax"}),
				per: new fields.StringField({
					required: true, nullable: true, blank: false, initial: null, label: "SKYFALL.LimitedUsesPer"
				}),
				recovery: new fields.StringField({required: true, blank: true, choices: ['rest','scene','turn']}),
			}),
			consume: new fields.SchemaField({
				type: new fields.StringField({required: true, blank: true, label: "SKYFALL.ConsumeType"}),
				target: new fields.StringField({
					required: true, nullable: true, initial: null, label: "SKYFALL.ConsumeTarget"
				}),
				amount: new fields.NumberField({required: true, integer: true, label: "SKYFALL.ConsumeAmount"}),
				scale: new fields.BooleanField({label: "SKYFALL.ConsumeScaling"})
			}, {label: "SKYFALL.ConsumeTitle"})
		}
	}

	/**
	 * Validate that each entry in the talents Set is a UUID.
	 * @param {string} uuid     The candidate value
	 */
	static validateUuid(uuid) {
		const {documentType, documentId} = foundry.utils.parseUuid(uuid);
		if ( CONST.DOCUMENT_TYPES.includes(documentType) || !foundry.data.validators.isValidId(documentId) ) {
			throw new Error(`"${uuid}" is not a valid UUID string`);
		}
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */
	
	/** @override */
	prepareData() {
		super.prepareData();
		console.log("DATAMODEL.prepareData()");
	}

	/**
	 * @override
	 */
	prepareDerivedData() {
		console.log("DATAMODEL.prepareDerivedData()");
		this._labels = {};
		console.log(this);

		let actions = ['action','bonus','reaction','free'];
		let action = this.activation.type;
		if ( action && !actions.includes(action) ){
			console.log(action, SYSTEM.activations)
			this._labels.action = {
				label: SYSTEM.activations[action].label,
				icon: SYSTEM.icons.sfmaction,
			}
		} else { 
			this._labels.action = {
				label: SYSTEM.activations[action].label,
				icon: SYSTEM.icons[`sf${action}`]
			}
		}
		
		if ( this.activation.repeatable ) {
			this._labels.cost = SYSTEM.icons.sfrepeatable;
		} else if ( this.activation.cost == 0 ) {
			this._labels.cost = "-";
		} else {
			this._labels.cost = game.i18n.format('{cost} {rsc}', {
				cost: this.activation.cost ?? "-",
				rsc: game.i18n.localize("SKYFALL.ACTOR.RESOURCES.EPABBR")
			});
		}

		this._labels.traits = {};
		if ( this.range.descriptive ) {
			this._labels.traits.range = {
				label: "SKYFALL.ITEM.ABILITY.RANGE",
				descriptive: this.range.descriptive,
			}
		} else {
			let tileSize = canvas.grid?.options?.dimensions?.distance ?? 1.5;
			this._labels.traits.range = {
				label: "SKYFALL.ITEM.ABILITY.RANGE",
				descriptive: game.i18n.format('{value} {unit} ({sqr} q)', {
						value: this.range.value,
						unit: this.range.unit,
						sqr: ( tileSize ) * this.range.value,
					}),
			}
		}
		if ( this.target.descriptive ) {
			this._labels.traits.target = {
				label: "SKYFALL.ITEM.ABILITY.TARGET",
				descriptive: this.target.descriptive
			}
		} else {}

		if ( this.duration.descriptive ) {
			this._labels.traits.duration = {
				label: "SKYFALL.ITEM.ABILITY.DURATION",
				descriptive: this.duration.descriptive
			}
		} else {}

		if ( this.attack.descriptive ) {
			this._labels.traits.attack = {
				label: "SKYFALL.ITEM.ABILITY.ATTACK",
				descriptive: this.attack.descriptive,
			}
			this._labels.attack ={
				hit: {
					label: "SKYFALL.ITEM.ABILITY.HIT",
					descriptive: this.attack.hit,
				},
				miss: {
					label: "SKYFALL.ITEM.ABILITY.MISS",
					descriptive: this.attack.miss,
				}
			}
		} else {}

		if ( this.activation.trigger ) {
			this._labels.traits.trigger = {
				label: "SKYFALL.ITEM.ABILITY.TRIGGER",
				descriptive: this.activation.trigger,
			}
		} else {}

		if ( this.effect.descriptive ) {
			this._labels.effect = {
				label: "SKYFALL.ITEM.ABILITY.EFFECT",
				descriptive: this.effect.descriptive,
			}
		} else {}

		if ( this.special.descriptive ) {
			this._labels.special = {
				label: "SKYFALL.ITEM.ABILITY.SPECIAL",
				descriptive: this.special.descriptive,
			}
		} else {}

		if ( this.components && this.components.length ) { 
			this._labels.traits.components = {
				label: "SKYFALL.ITEM.SPELL.COMPONENTS",
				descriptive: this.components.map(i => i[0]).join(", ").toUpperCase(),
			}
		}
	}
}