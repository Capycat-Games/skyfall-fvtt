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
		const AttackAbilities = {
			...SYSTEM.abilities,
			magic: {id: 'magic', label:'SKYFALL2.ABILITY.Spellcasting'},
			// weapon: {id: 'weapon', label:'TYPES.Item.weapon'},
		}
		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true}),
			}),
			origin: new fields.StringField({required: true}, {validate: Ability.validateUuid}),
			modification: new fields.SetField(new fields.StringField({required: true}, {validate: Ability.validateUuid})),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL.DESCRIPTORS"})),

			activation: new fields.SchemaField({
				type: new fields.StringField({
					required: true,
					choices:SYSTEM.activations,
					initial: 'action',
					label: "SKYFALL2.ACTIVATION.Type"
				}),
				cost: new fields.NumberField({
					required: true,
					label: "SKYFALL2.Cost"
				}),
				repeatable: new fields.BooleanField({
					label: "SKYFALL2.ACTIVATION.Repeatable"
				}),
				recharge: new fields.BooleanField({
					label: "SKYFALL2.ACTIVATION.Recharge"
				}),
			}, {label: "SKYFALL2.Activation"}),
			trigger: new fields.SchemaField({
				descriptive: new fields.StringField({required: true, blank: true, label: "SKYFALL2.Description"}),
				// TODO - SHOULD HAVE AUTOMATION?
			}, {label: "SKYFALL2.Trigger"}),
			duration: new fields.SchemaField({
				descriptive: new fields.StringField({
					required: true,
					blank: true,
					label: "SKYFALL2.Description"
				}),
				value: new fields.NumberField({
					required: true,
					integer: true,
					min: 0,
					label: "SKYFALL2.Value"
				}),
				units: new fields.StringField({
					required: true,
					blank: true,
					choices: SYSTEM.durations,
					initial: "",
					label: "SKYFALL2.UnitPl"
				}),
				event: new fields.StringField({
					required: true,
					blank: true,
					choices: SYSTEM.events,
					initial: "",
					label: "SKYFALL2.Event"
				}),
				concentration: new fields.BooleanField({
					required: true,
					initial: false,
					label: "SKYFALL2.DURATION.Concentration"
				}),
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
				type: new fields.StringField({
					required: false,
					nullable: true,
					initial: null,
					label: "SKYFALL2.Ability"
				}),
				ability: new fields.StringField({
					required: true,
					blank: true,
					nullable: true,
					choices: AttackAbilities,
					initial: null,
					label: "SKYFALL2.Ability"
				}),
				protection: new fields.StringField({required: true, blank: true, choices: SYSTEM.abilities, label: "SKYFALL2.ABILITY.Protection"}),
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

	static migrateData(source) {
		if ( source.attack ) {
			let { type, ability } = source.attack;

			if ( type === null && ability === null ){
				// NEW ITEM
				source.attack.ability = '';
			} else if ( type !== null && ability == null ){
				const AttackAbilities = {
					magic: {id: 'magic', label:'SKYFALL2.ABILITY.Spellcasting'},
					...SYSTEM.abilities,
				}
				let newType = type.replace('@','');
				if ( newType in AttackAbilities ) {
					source.attack.ability = newType;
				} else {
					source.attack.ability = '';
				}
			} else if ( ability !== null && ability.startsWith('@') ){
				source.attack.ability = ability.replace('@','');
			}
		}
		return super.migrateData(source);
	}

	
	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	get action() {
		return this.activation.type;
	}

	
	get isRanged(){
		return this.range.value != 1.5;
	}

	get labels() {
		const addLabel = function (dom, label) {
			const div = document.createElement('div');
			div.innerHTML = dom;
			const labelDOM = document.createElement('label');
			labelDOM.innerText = `${label}: `;
			div.querySelector('p').prepend(labelDOM);
			return div.innerHTML;
		}
		const labels = {};
		// ACTIVATION
		const actions = new Set(['action','bonus','reaction','free','passive']);
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
			labels.properties ??= {};
			if ( this[prop]?.descriptive ) {
				labels.properties[prop] = {
					label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
					descriptive: this[prop].descriptive,
				};
			} else if ( prop == 'range' ) {
				const {units, value} = this[prop];
				if ( !units ) continue;
				if ( ['m','km','ft','mi'].includes(units) ) {
					labels.properties[prop] = {
						label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
						descriptive: game.i18n.format('{value} {units}', {
							value: value,
							units: SYSTEM.ranges[units]?.label ?? ''
						})
					};
				} else {
					labels.properties[prop] = {
						label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
						descriptive: SYSTEM.ranges[units]?.label ?? '',
					};
				}
			} else if ( prop == 'target' ) {
				const { type, quantity, shape, length, width, units } = this[prop];
				if ( !type ) continue;
				const squares = length / game.system.grid.distance;
				const details = {
					general: game.i18n.localize('SKYFALL2.TARGET.Length'),
					circle: game.i18n.localize('SKYFALL2.TARGET.CircleLength'),
				}
				if ( shape ) {
					const descriptive = game.i18n.format('SKYFALL2.TARGET.DescritptiveWithArea', {
						quantity: quantity || '',
						type: SYSTEM.individualTargets[type].label,
						shape: SYSTEM.areaTargets[shape].label,
						length: `${length}${units}`,
						squares: `${squares}q`,
						details: ['radius','cylinder','sphere'].includes(shape) ? details.circle : details.general
					});
					labels.properties[prop] = {
						label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
						descriptive: descriptive
					};
				} else {
					const descriptive = game.i18n.format('SKYFALL2.TARGET.Descritptive', {
						quantity: quantity || '',
						type: SYSTEM.individualTargets[type].label
					});
					labels.properties[prop] = {
						label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
						descriptive: descriptive
					};
					
				}
			} else if ( prop == 'duration' ) {
				const {value, units, concentration, event} = this[prop];
				if ( !units ) continue;
				const con = game.i18n.localize('SKYFALL2.DURATION.Concentration');
				const format = units == 'until' && event ? SYSTEM.events[event].prop : '{value} {units} {concentration}';
				labels.properties[prop] = {
					label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
					descriptive: game.i18n.format(format, {
						value: value || '',
						units: SYSTEM.durations[units].label,
						concentration: concentration ? `(${con})` : '',
					})
				};
			} else if ( prop == 'attack' ) {
				const {ability, protection} = this[prop];
				if ( !ability || !protection ) continue;
				const AttackAbilities = {
					...SYSTEM.abilities,
					magic: {
						id: 'magic',
						label: game.i18n.localize('SKYFALL2.ABILITY.Spellcasting'),
						abbr: game.i18n.localize('SKYFALL2.ABILITY.SpellcastingAbbr')
					},
				}
				labels.properties[prop] = {
					label: `SKYFALL.ITEM.ABILITY.${prop.toUpperCase()}`,
					descriptive: game.i18n.format('{ability} vs {protection}', {
						ability: AttackAbilities[ability].abbr ?? '-',
						protection: AttackAbilities[protection].abbr ?? '-',
					})
				};
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
			if ( this.attack.hit ) {
				labels.attack.hit = {
					label: `SKYFALL.ITEM.ABILITY.HIT`,
					descriptive: this.attack.hit,
				}
				TextEditor.enrichHTML(this.attack.hit, {}).then(
					(data) => labels.attack.hit.descriptive = data
				);
			}
			if ( this.attack.miss ) {
				labels.attack.miss = {
					label: `SKYFALL.ITEM.ABILITY.MISS`,
					descriptive: this.attack.miss,
				}
				TextEditor.enrichHTML(this.attack.miss, {}).then(
					(data) => labels.attack.miss.descriptive = data
				);
			}
		}

		// , 'effect', 'special'
		if ( this.effect.descriptive ) {
			let descriptive = addLabel(
				this.effect.descriptive,
				game.i18n.localize('SKYFALL.ITEM.ABILITY.EFFECT')
			);
			
			labels.effect = {
				label: `SKYFALL.ITEM.ABILITY.EFFECT`,
				descriptive: this.effect.descriptive,
			};

			TextEditor.enrichHTML(this.effect.descriptive, {}).then(
				(data) => labels.effect.descriptive = data
			);
		}
		if ( this.special.descriptive ) {
			labels.special = {
				label: `SKYFALL.ITEM.ABILITY.SPECIAL`,
				descriptive: this.special.descriptive,
			};
			TextEditor.enrichHTML(this.special.descriptive, {}).then(
				(data) => labels.special.descriptive = data
			);
		}
		
		// Modifications
		const modifications = this.parent?.effects.map( ef => `@Embed[${ef.uuid}]` ).join(' ');
		if ( modifications ) {
			Promise.all([
				TextEditor.enrichHTML(modifications,{})
			]).then((data) => labels.modifications = data );
		}
		return labels;
	}


	/* -------------------------------------------- */
	/*  Data Preparation                            */
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
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	// async _preUpdate(changes, options, user) {
	// 	if ( user.id != game.user.id ) return false;
	// 	console.groupCollapsed("DataModel: Ability._preUpdate");
	// 	console.log( changes );
	// 	console.log( this );
	// 	// console.log( this.parent );

	// 	console.log( "changes.system.attack.type", changes.system.attack.type );
	// 	console.log( "system.attack.type", this.attack.type );
	// 	console.log( "_source.attack.type", this._source.attack.type );
	// 	console.log( "changes.system.attack.ability", changes.system.attack.ability );
	// 	console.log( "system.attack.ability", this.attack.ability );
	// 	console.log( "_source.attack.ability", this._source.attack.ability );
		
	// 	console.groupEnd();
	// 	// if ( 'type' in this.attack ) {
	// 	// 	this.updateSource({
	// 	// 		"attack.-=type": null
	// 	// 	});
	// 	// }
	// }

	/** @override */
	async toEmbed(config, options={}) {
		config.classes = "ability-embed";
		config.cite = false;
		config.caption = false;
		let modifications = this.parent.effects.filter(ef => ef.type == "modification").map(ef => `@EMBED[${ef.uuid}]`);
		
		const abilityCard = await renderTemplate("systems/skyfall/templates/v2/item/ability-card.hbs", {
			SYSTEM: SYSTEM,
			document: this.parent,
			item: this.parent,
			system: this,
			labels: this.labels,
			isPlayMode: true,
			isEmbed: true,
			enriched: [],
			modifications: modifications.join(''),
		});
		
		const container = document.createElement("div");
		container.innerHTML = await TextEditor.enrichHTML(abilityCard, {});
		
		return container.firstChild;
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