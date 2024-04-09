/**
 * Data schema, attributes, and methods specific to Antecedente type Items.
 */
export default class Antropologia extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true}),
			}),
			// carateristicas são concedidas por: Legado, Herança, Maldição, Antecedente
			// talentos são concedidos por: Legado, Maldição, Classe, Trilha
			// habilidades: são concedidas por: (Natural), Caracteristicas, Talentos
			// talentos: new fields.ArrayField(new fields.StringField({})),
			// modificações são concedidas por: Caracteristicas, Talentos, Magias, Sigilos, (Equipamentos?)
			features: new fields.SetField(new fields.StringField({required: true}, {validate: Antropologia.validateUuid})),
			abilities: new fields.SetField(new fields.StringField({required: true}, {validate: Antropologia.validateUuid})),
			feats: new fields.SetField(new fields.StringField({required: true}, {validate: Antropologia.validateUuid})),
			modification: new fields.SetField(new fields.StringField({required: true}, {validate: Antropologia.validateUuid})),
			favorite: new fields.BooleanField({initial: false}),
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