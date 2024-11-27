import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Weapon type Items.
 */
export default class Weapon extends PhysicalItemData {
	
	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		
		return foundry.utils.mergeObject(super.defineSchema(), {
			...this.equippableSchema(),
			/* simples | marciais | fogo | regional */
			category: new fields.StringField({required: true, blank: false, choices: SYSTEM.weapons, initial: "simple", label:"SKYFALL2.Category"}),
			purpose: new fields.StringField({required: true, blank: false, choices: {
				melee: {id: 'melee', label: "SKYFALL2.ATTACK.Melee"},
				ranged: {id: 'ranged', label: "SKYFALL2.ATTACK.Ranged"},
			}, initial: "melee", label:"SKYFALL2.Purpose"}),
			/* uma mão | duas mãos */
			wield: new fields.NumberField({required: true, integer: true, choices:{1:"SKYFALL2.WIELD.OneHand",2:"SKYFALL2.WIELD.TwoHand"}, initial:1, label:"SKYFALL2.Wield"}),
			attack: this.attackSchema(),
			damage: this.damageSchema(),
			range: new fields.NumberField({required: true, min: 0, label:"SKYFALL2.Range"}),
			consume: new fields.SchemaField({
				type: new fields.StringField({
					required: true,
					blank: true,
					initial: 'ammo',
					label: "SKYFALL2.Type"
				}),
				target: new fields.StringField({
					required: true,
					blank: true,
					initial: '',
					label: "SKYFALL2.CONSUMABLE.Ammo"
				})
			}),
			reload: new fields.SchemaField({
				value: new fields.NumberField({
					required: true,
					min: 0,
					label:"SKYFALL2.Quantity"
				}),
				quantity: new fields.NumberField({
					required: true,
					min: 0,
					label:"SKYFALL2.Quantity"
				}),
				actions: new fields.ArrayField(new fields.StringField({
					required: true,
					choices: [
						'action',
						'bonus',
						'free',
					],
				}), {label: "SKYFALL2.ActionPl"})
			}, {label: "SKYFALL2.Reload"}),
			sigils: new fields.ArrayField(new fields.SchemaField({
				uuid: new fields.StringField({required: true}, {validate: Weapon.validateUuid}),
				parentUuid: new fields.StringField({required: true}, {validate: Weapon.validateUuid}),
				infused: new fields.BooleanField({required:true, initial:false})
			}), {max: 4}),
		})
	}
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Getters/Setters                             */
	/* -------------------------------------------- */

	get isRanged(){
		return this.purpose == 'ranged';
		return this.descriptors.includes('thrown') || this.descriptors.includes('shooting');
	}

	get isMelee(){
		return this.purpose == 'melee';
		return !this.descriptors.includes('shooting');
	}

	get fullName(){
		return this.parent.name;
	}
	
	/* -------------------------------------------- */
	/*  System Operations                           */
	/* -------------------------------------------- */

	/**
	 * Turn Item data into ActiveEffect
	 */
	abilityContent(ability){
		ability.system.attack.ability = this.attack.ability;
		ability.system.attack.damage = this.attack.damage;
		ability.system.descriptors.push( ...this.descriptors );
		if ( ability.system.range.value > 1.5 ) {
			ability.system.range.value = this.range;
		}
		return ability;
		return [
			{
				key: "system.attack.ability",
				mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				value: this.attack.ability,
			},
			{
				key: "system.attack.damage",
				mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				value: this.attack.damage,
			}
		]
	}

	/* -------------------------------------------- */
	/* Data Preparation                             */
	/* -------------------------------------------- */
	
	/** @inheritDoc */
	prepareBaseData() {}

	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareDerivedData() {}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async toEmbed(config, options={}) {
		return null;
	}

	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if ( user.id !== game.userId ) return;
		// RESET EQUIPABLE
		this.updateSource({
			"equipped": false,
			"attuned": false,
			"favorite": false,
		});
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	_onCreate(data, options, userId) {}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preUpdate(changes, options, user) {
		let allow = await super._preUpdate(changes, options, user);
		if ( allow === false ) return false;
		this.automateDescriptors(changes, options, user);
	}

	automateDescriptors( changes, options, user ){
		if ( user.id !== game.userId ) return false;
		if ( !foundry.utils.hasProperty(changes, 'system.descriptors') ) return true;
		if ( !changes.system.descriptors.length ) return true;
		const descriptors = changes.system.descriptors;
		const current = this.descriptors;
		const actor = this.parent.actor;
		for ( const d of descriptors ) {
			if ( current.includes(d) ) continue;
			if ( d == 'light' ) {
				const {str, dex} = actor ? actor.system.abilities : {str: {}, dex: {}};
				const abl = (actor && str.value > dex.value ? 'str' : 'dex');
				this.updateSource({
					"attack.ability": abl,
					"damage.ability": abl,
				});
			}
		}
		return true;
	}
	/* -------------------------------------------- */

	/** @inheritDoc */
	_onUpdate(changed, options, userId) {}

	/* -------------------------------------------- */


	/** @inheritDoc */
	async _preDelete(options, user) {}

	/* -------------------------------------------- */

	/** @inheritDoc */
	_onDelete(options, userId) {}
}