/**
 * Data schema, attributes, and methods specific to Modification type ActiveEffects.
 */
export default class Modification extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		
		return {
			//EFEITO => ActiveEffect.description
			origin: new fields.StringField({required: true}, {validate: Modification.validateUuid}),
			specialDuration: new fields.StringField({required: true, blank:true, choices:[{id:'scene','label':'SKYFALL.ITEM.DURATION.SCENE'}], initial: '', label:"SKYFALL.ITEM.SPECIALDURATION"}),
			apply: new fields.SchemaField({
				always: new fields.BooleanField({required: true, initial:false, label: "SKYFALL.MODIFICATION.APPLYALWAYS"}),
				itemName: new fields.StringField({required:true, blank: true, label: "SKYFALL.MODIFICATION.ITEMNAME"}),
				itemType: new fields.ArrayField(new fields.StringField({required:true, blank: true}), {label: "SKYFALL.MODIFICATION.ITEMTYPE"}),
				descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, }), {initial: () => ([]), label: "SKYFALL.MODIFICATION.DESCRIPTOR"}),
			}),
			cost: new fields.SchemaField({
				value: new fields.NumberField({required: true, integer: true, initial:0, label: "SKYFALL.ITEM.ABILITY.COST"}),
				resource: new fields.StringField({required: true, blank: false, choices: SYSTEM.resources, initial: "ep", label: "SKYFALL.RESOURCE"}),
				multiple: new fields.BooleanField({required: true, initial:false, label: "SKYFALL.MODIFICATION.APPLYMULTIPLE"}),
			}),
			// TODO - ADD TARGET
			changes: new fields.ArrayField(new fields.SchemaField({
				key: new fields.StringField({required: true, label: "EFFECT.ChangeKey"}),
				value: new fields.StringField({required: true, label: "EFFECT.ChangeValue"}),
				mode: new fields.NumberField({integer: true, initial: CONST.ACTIVE_EFFECT_MODES.ADD,
					label: "EFFECT.ChangeMode"}),
				priority: new fields.NumberField()
			})),
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
}