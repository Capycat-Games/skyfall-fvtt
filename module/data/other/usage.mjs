/**
 * Data schema, attributes, and methods specific to Usage type ChatMessages.
 */
export default class UsageMessage extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			// Uuid of item (ability) being used
			abilityId: new fields.StringField({required: true}, {validate: UsageMessage.validateUuid}),
			// Uuid of item (ie: weapon) being used
			itemId: new fields.StringField({required: true}, {validate: UsageMessage.validateUuid}),

			// Documents Object data at the time usage was configured
			actorState: new fields.ObjectField(),
			abilityState: new fields.ObjectField(),
			itemState: new fields.ObjectField(),
			// Object data for Modifications
			// modifications: new fields.ArrayField( new fields.ObjectField() ),
			modifications: new fields.ObjectField({required:true}),
			// Object data for Rolls (Unresolved)
			rolls: new fields.ArrayField( new fields.ObjectField() ),
			// Object data for result Item (after withItem and modification is applied)
			item: new fields.ObjectField(),
			
			// Uuid of targets of possible effects
			targets: new fields.ArrayField( new fields.StringField() ),
			// Object data for Measured Templates ( post commit data? )
			measuredTemplate: new fields.ArrayField( new fields.ObjectField() ),
			// Object data for Active Effects
			effects: new fields.ArrayField( new fields.ObjectField() ),
			
			status: new fields.SchemaField({
				phase: new fields.NumberField({required: true, integer: true, initial:1, min: 1, max: 4, label: "SKYFALL.PHASE"}),
				configured: new fields.BooleanField({initial:false}),
				commited: new fields.BooleanField({initial:false}),
				// Uuid of Actor that gave aid
				aid: new fields.ArrayField( new fields.StringField({required: true}, {validate: UsageMessage.validateUuid}) ),
				// Uuid of Actor that gave catharsis
				catharsis: new fields.ArrayField( new fields.StringField({required: true}, {validate: UsageMessage.validateUuid}) ),
			})
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