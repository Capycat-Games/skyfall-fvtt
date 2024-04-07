/**
 * Data schema, attributes, and methods specific to Ancestry type Items.
 */
export default class Modification extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			//EFEITO => ActiveEffect.description
			origin: new fields.StringField({required: true}, {validate: Modification.validateUuid}),
			type: new fields.StringField({required: true, blank: false, choices: SYSTEM.modificationTypes, initial: "adiciona"}),
			cost: new fields.NumberField({required: true, integer: true, min: 0}),
			target: new fields.StringField({required: true, blank: false, choices: SYSTEM.resources, initial: "ep"}),
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