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
			// Uuid of actor using
			actorId: new fields.StringField({required: true}, {validate: UsageMessage.validateUuid}),
			// Uuid of ability being used
			abilityId: new fields.StringField({required: true}, {validate: UsageMessage.validateUuid}),
			// Uuid of item being used
			itemId: new fields.StringField({required: true}, {validate: UsageMessage.validateUuid}),
			// Object data for result Item (after withItem and modification is applied)
			item: new fields.ObjectField(),

			// Documents Object data at the time usage was configured
			// actorState: new fields.ObjectField(),
			// abilityState: new fields.ObjectField(),
			// itemState: new fields.ObjectField(),
			// Object data for Modifications
			// modifications: new fields.ArrayField( new fields.ObjectField() ),
			modifications: new fields.ObjectField({required:true}),
			// Object data for Rolls (Unresolved)
			rolls: new fields.ArrayField( new fields.ObjectField() ),
			
			
			// Uuid of targets of possible effects
			targets: new fields.ArrayField( new fields.StringField() ),
			// Object data for Measured Templates ( post commit data? )
			measuredTemplate: new fields.ArrayField( new fields.ObjectField() ),
			// Object data for Active Effects
			effects: new fields.ArrayField( new fields.ObjectField() ),
			costs: new fields.SchemaField({
				hp: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				ep: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				catharsis: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				shadow: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				uses: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				quantity: new fields.ArrayField(new fields.SchemaField({
					id: new fields.StringField({
						require: true,
						blank: true,
					}),
					path: new fields.StringField({
						require: true,
						blank: true,
					}),
					value: new fields.NumberField({
						require: true,
						initial: 0
					}),
				})),
				// new fields.NumberField({
				// 	nullable: true, blank: true, integer: true, initial:0, min: 0
				// }),
				charges: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
			}),
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