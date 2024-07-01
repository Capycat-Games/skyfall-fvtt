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
		console.log(SYSTEM.areaTargets);
		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true}),
			}),
			origin: new fields.StringField({required: true}, {validate: Ability.validateUuid}),
			modification: new fields.SetField(new fields.StringField({required: true}, {validate: Ability.validateUuid})),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL.DESCRIPTORS"})),

			activation: new fields.SchemaField({
				type: new fields.StringField({required: true, choices:SYSTEM.activations, initial: 'action', label: "SKYFALL2.ACTIVATION.Type"}),
				cost: new fields.NumberField({required: true, label: "SKYFALL2.Cost"}),
				repeatable: new fields.BooleanField({label: "SKYFALL2.ACTIVATION.Repeatable"}),
			}, {label: "SKYFALL2.Activation"}),
			trigger: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Description"}),
				// TODO - SHOULD HAVE AUTOMATION?
			}, {label: "SKYFALL2.Trigger"}),
			duration: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Description"}),
				value: new fields.NumberField({required: true, integer: true, min: 0, label: "SKYFALL2.Value"}),
				units: new fields.StringField({required: true, blank: true, choices: SYSTEM.durations, initial: "", label: "SKYFALL2.UnitPl"}),
			}, {label: "SKYFALL2.Duration"}),
			target: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Description"}),
				type: new fields.StringField({required: true, blank: true, choices: SYSTEM.individualTargets, initial: "", label: "SKYFALL2.Type"}),
				quantity: new fields.NumberField({required: true, integer: true, min: 0, label: "SKYFALL2.Quantity"}),
				shape: new fields.StringField({required: true, blank: true, choices: SYSTEM.areaTargets, initial: "", label: "SKYFALL2.TARGET.Shape"}),
				length: new fields.NumberField({required: true, blank: true, min: 0, label: "SKYFALL2.TARGET.Length"}),
				width: new fields.NumberField({required: true, blank: true, min: 0, label: "SKYFALL2.TARGET.Width"}),
				units: new fields.StringField({required: true, blank: true, choices: SYSTEM.movementUnits, initial: "m", label: "SKYFALL2.Unit"}),
			}, {label: "SKYFALL2.Target"}),
			range: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Description"}),
				value: new fields.NumberField({required: true, min: 0, label: "SKYFALL2.Value"}),
				units: new fields.StringField({required: true, blank: true, choices: SYSTEM.ranges, initial: "self", label: "SKYFALL2.Unit"}),
			}),
			
			attack: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Description"}),
				hit: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.ATTACK.Hit"}),
				miss: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.ATTACK.Miss"}),
				//Formula Variable @for, @des, @magico, @weaponName
				type: new fields.StringField({required: true, blank: true, label: "SKYFALL2.ATTACK.Type"}),
				protection: new fields.StringField({required: true, blank: true, choices: SYSTEM.abilities, label: "SKYFALL2.ATTACK.Protection"}),
				damage: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Damage"}),
			}),
			effect: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
				damage: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Damage"}),
			}),
			special: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
			}),
			uses: new fields.SchemaField({
				value: new fields.NumberField({required: true, min: 0, integer: true, label: "SKYFALL.LimitedUsesAvailable"}),
				max: new fields.NumberField({required: true, integer: true, min: 0, label: "SKYFALL.LimitedUsesMax"}),
				per: new fields.StringField({
					required: true, nullable: true, blank: false, initial: null, label: "SKYFALL.LimitedUsesPer"
				}),
				recovery: new fields.StringField({required: true, blank: true, choices: ['srest','lrest','scene','turn']}),
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
	/*  Getters                                     */
	/* -------------------------------------------- */

	get action() {
		return this.activation.type;
	}

	
	get isRanged(){
		return this.range.value > 1.5;
	}

	get labels() {
		const labels = {};
		// ACTIVATION
		const actions = new Set(['action','bonus','reaction','free']);
		labels.action = {
			label: SYSTEM.activations[this.action].label,
			icon: actions.has(this.action) ? SYSTEM.icons[`sf${this.action}`] : SYSTEM.icons.sfmaction
		}
		// COST
		labels.cost = {
			value: this.activation.cost,
			label: ( this.activation.repeatable ? SYSTEM.icons.sfrepeatable
				: game.i18n.format('{cost} {rsc}', {
					cost: this.activation.cost ?? "-",
					rsc: game.i18n.localize("SKYFALL.ACTOR.RESOURCES.EPABBR")
				})
			)
		}
		// spellIcon
		const spellDescriptors = ['control','ofensive','utility'];
		for ( const spelld of spellDescriptors ) {
			if ( this.descriptors.includes(spelld) ) {
				labels.spell = {
					label: SYSTEM.DESCRIPTORS[spelld].label,
					icon: SYSTEM.icons[`sfspell${spelld}`]
				}
			}
		}
		// Descriptors
		if ( this.descriptors.length ){
			labels.descriptors =  skyfall.utils.descriptorsTags(this.descriptors, {});
		}
		// Properties
		const props = ['range','target', 'duration', 'attack', 'trigger'];
		for (const prop of props) {
			if ( !this[prop]?.descriptive ) continue;
			labels.properties ??= {};
			labels.properties[prop] = {
				label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
				descriptive: this[prop].descriptive,
			};
			if ( prop == "attack" ) {
				// labels.properties[prop].roll = `[[/rr type=attack ability=${this[prop].type.replace("@","")}]]{${this[prop].descriptive}}`;
			}
		}

		if ( this.components && this.components.length ) { 
			labels.properties ??= {};
			labels.properties.components = {
				label: "SKYFALL.ITEM.SPELL.COMPONENTS",
				descriptive: this.components.map(i => i[0]).join(", ").toUpperCase(),
			}
		}
		
		// Attack
		if ( labels.properties?.attack ) {
			labels.attack = {};
			if ( this.attack.hit ) labels.attack.hit = {
				label: `SKYFALL.ITEM.ABILITY.HIT`,
				descriptive: this.attack.hit,
			}
			if ( this.attack.miss ) labels.attack.miss = {
				label: `SKYFALL.ITEM.ABILITY.MISS`,
				descriptive: this.attack.miss,
			}
		}

		// , 'effect', 'special'
		if ( this.effect.descriptive ) {
			labels.effect = {
				label: `SKYFALL.ITEM.ABILITY.EFFECT`,
				descriptive: this.effect.descriptive,
			};
		}
		if ( this.special.descriptive ) {
			labels.special = {
				label: `SKYFALL.ITEM.ABILITY.SPECIAL`,
				descriptive: this.special.descriptive,
			};
		}
		return labels;
	}


	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */
	
	/** @override */
	prepareData() {
		super.prepareData();
		
	}

	/**
	 * @override
	 */
	prepareDerivedData() {
		this.range.icon = this.isRanged ? SYSTEM.icons.sfranged : SYSTEM.icons.melee;

		this._labels = {};
		let actions = ['action','bonus','reaction','free'];
		let action = this.activation.type;
		if ( action && !actions.includes(action) ){
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
		
		// Prepare descriptor structure {id, type, label, hint, value}
		if ( this.descriptors ) {
			const _descriptors = [ ...this.descriptors ];
			this._labels.descriptors = _descriptors.reduce((acc, key) => {
				acc[key] = {
					value: (this.descriptors.includes(key)),
					...SYSTEM.DESCRIPTORS[key] ?? {
						id: key, hint: "", type: "origin", label: key.toUpperCase(),
					}
				}
				return acc;
			}, {});
		}
		// Prepare spellIcon
		const spellDescriptors = ['control','ofensive','utility'];
		for ( const spelld of spellDescriptors ) {
			if ( this.descriptors.includes(spelld) ) {
				this._labels.spell = {
					label: SYSTEM.DESCRIPTORS[spelld].label,
					icon: SYSTEM.icons[`sfspell${spelld}`]
				}
			}
		}

		this._labels.properties = {};
		if ( this.range.descriptive ) {
			this._labels.properties.range = {
				label: "SKYFALL.ITEM.ABILITY.RANGE",
				descriptive: this.range.descriptive,
			}
		} else {
			let tileSize = canvas.grid?.options?.dimensions?.distance ?? 1.5;
			this._labels.properties.range = {
				label: "SKYFALL.ITEM.ABILITY.RANGE",
				descriptive: game.i18n.format('{value} {unit} ({sqr} q)', {
						value: this.range.value,
						unit: this.range.unit,
						sqr: ( tileSize ) * this.range.value,
					}),
			}
		}
		if ( this.target.descriptive ) {
			this._labels.properties.target = {
				label: "SKYFALL.ITEM.ABILITY.TARGET",
				descriptive: this.target.descriptive
			}
		} else {}

		if ( this.duration.descriptive ) {
			this._labels.properties.duration = {
				label: "SKYFALL.ITEM.ABILITY.DURATION",
				descriptive: this.duration.descriptive
			}
		} else {}

		if ( this.attack.descriptive ) {
			this._labels.properties.attack = {
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
			this._labels.properties.trigger = {
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
			this._labels.properties.components = {
				label: "SKYFALL.ITEM.SPELL.COMPONENTS",
				descriptive: this.components.map(i => i[0]).join(", ").toUpperCase(),
			}
		}
	}

	/**
	 * 
	 * @param {*} config 
	 * @param {*} options 
	 * @returns 
	 */
	async _embed(config, options={}) {
		const container = document.createElement("div");
		
		container.innerHTML = `
			<div class="ability-header">
				<span>action</span>
				<h5>NOME<h5>
				<a data-action="someAction">SOMEACTION</a>
			</div>
			<div class="modification-description">
				${this.name}
			</div>
		`;
		return container.children;
	}
}