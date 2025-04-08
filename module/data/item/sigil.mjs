import Ability from "./ability.mjs";

/**
 * Data schema, attributes, and methods specific to Spell type Items.
 */
export default class Sigil extends foundry.abstract.TypeDataModel {
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
				choices: {prefix:"SKYFALL2.SIGIL.Prefix", sufix:"SKYFALL2.SIGIL.Sufix"},
				initial: "prefix",
				label: "SKYFALL2.Type"
			}),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL.DESCRIPTORS"})),
			charges: new fields.SchemaField({
				value: new fields.NumberField({
					required:true,
					integer: true,
					min: 0,
					initial: 1,
					label: "SKYFALL2.Charge",
				}),
				max: new fields.NumberField({
					required:true,
					integer: true,
					min: 1,
					initial: 1,
				}),
			}),
			activation: new fields.SchemaField({
				type: new fields.StringField({required: true, choices:SYSTEM.activations, initial: 'action', label: "SKYFALL2.ACTIVATION.Type"}),
			}, {label: "SKYFALL2.Activation"}),
			effect: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
			}),
			fragments: new fields.SchemaField({
				value: new fields.BooleanField({
					initial: false,
					label: "SKYFALL2.Infused",
				}),
				amount: new fields.NumberField({
					required:true,
					integer: true,
					initial: 1,
					label: "SKYFALL2.Quantity"
				}),
				type: new fields.StringField({
					required: true,
					blank: true,
					choices: {permanent:"SKYFALL2.Permanent", recharge:"SKYFALL2.Recharge"},
					initial: "permanent",
					label: "SKYFALL2.Type",
				}),
			}),
			item: new fields.StringField({required: true, label:"SKYFALL2.Item", validate: Sigil.validateUuid}),
		};
	}

	/**
	 * Validate that each entry in the talents Set is a UUID.
	 * @param {string} uuid     The candidate value
	 */
	static validateUuid(uuid) {
		return true;
		const {documentType, documentId} = foundry.utils.parseUuid(uuid);
		if ( CONST.DOCUMENT_TYPES.includes(documentType) || !foundry.data.validators.isValidId(documentId) ) {
			throw new Error(`"${uuid}" is not a valid UUID string`);
		}
	}

	getRollData() {
		return {};
	}
	/* ---------------------------------------- */
	/*  GETTERS                                 */
	/* ---------------------------------------- */
	
	get action() {
		return this.activation.type;
	}

	get infused(){
		return this.fragments.value;
	}

	get labels(){
		const labels = {};
		// ACTIVATION
		const actions = new Set(['action','bonus','reaction','free']);
		labels.action = {
			label: SYSTEM.activations[this.action].label,
			icon: actions.has(this.action) ? SYSTEM.icons[`sf${this.action}`] : SYSTEM.icons.sfmaction
		}
		if ( this.charges && (!this.infused && this.fragments.type == "permanent") ) {
			labels.charges ??= {};
			labels.charges = {
				label: `SKYFALL2.ChargePl`,
				descriptive: `${this.charges.value}/${this.charges.max}`,
			};
		}
		if ( this.effect.descriptive ) {
			labels.effect = {
				label: `SKYFALL.ITEM.ABILITY.EFFECT`,
				descriptive: this.effect.descriptive,
			};
		}
		if ( this.fragments ) {
			const pl = this.fragments.amount > 1 ? "Pl" : "";
			const type = game.i18n.format(
				`SKYFALL2.FRAGMENT.${this.fragments.type.titleCase()}`, {
				action: `${labels.action.icon} ${labels.action.label}`
			});
			const formatData = {
				amount: this.fragments.amount,
				fragments: game.i18n.localize(`SKYFALL2.Fragment${pl}`),
				type: type
			}

			labels.fragments = {
				label: game.i18n.localize("SKYFALL2.FRAGMENT.Infusing"),
				descriptive: game.i18n.format("SKYFALL2.FRAGMENT.Infuse", formatData)
			};
		}
		
		// Descriptors
		if ( this.descriptors.length ){
			labels.descriptors =  skyfall.utils.descriptorsTags(this.descriptors, {sigil: true});
		}
		if ( this.item ) {
			labels.equipment = fromUuidSync(this.item);
			labels.equipment.magicName = labels.equipment.magicName ?? labels.equipment.name;
		}
		return labels;
	}

	get rank(){
		let rank = this.descriptors.find( i => SYSTEM.SIGILDESCRIPTOR.RANK[i] )?.replace(/\D/gi,'');
		rank = Number( rank ) ;
		return rank ?? 1;
	}

	get equipment(){
		return this.descriptors.find( i => SYSTEM.SIGILDESCRIPTOR.GEAR[i] );
	}

	get clothing(){
		return this.descriptors.find( i => SYSTEM.SIGILDESCRIPTOR.CLOTHING[i] );
	}
}
