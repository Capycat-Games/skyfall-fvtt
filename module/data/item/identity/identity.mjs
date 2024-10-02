/**
 * Data schema, attributes, and methods specific to Antecedente type Items.
 */
export default class Identity extends foundry.abstract.TypeDataModel {
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
			features: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
			abilities: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
			feats: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
			modification: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
			favorite: new fields.BooleanField({initial: false}),
		}
	}
	
	static _progression( ){
		const fields = foundry.data.fields;
		/*
		legacy - DRACO
		- feature - Sangue Dracônico
		- - ability - Sopro Dracônico
		- feature - Armas Dracônicas
		- - weapon - Garras
		- - weapon - Chifres
		- - weapon - Cauda
		- - weapon - Mordida
		- heritage - Azuis
		- - feature - Sangue Elétrico
		- - feature - Arcanum de Fofuxa
		feat-0 - Escamas Protetoras
		- - 
		*/
		return new fields.SchemaField({
			source: new fields.StringField({
				// legacy | item(id ? source?)-granted-#
			}),
			grant: new fields.ArrayField(
				new fields.SchemaField({
					type: new fields.StringField({
						choices: ['item','ability','skill','proficiency','','slot']
					}),
					item: new fields.SchemaField({
						uuid: new fields.StringField({}), //uuid
						granted: new fields.StringField({}), //uuid
					}),
					ability: new fields.SchemaField({
						chosen: new fields.StringField({}),
						value: new fields.NumberField({}),
					}),
					skill: new fields.SchemaField({
						chosen: new fields.StringField({}),
						value: new fields.NumberField({}),
					}),
					proficiency: new fields.SchemaField({
						chosen: new fields.StringField({}),
					}),
					slot: new fields.SchemaField({
						type: new fields.StringField({
							// feature, feat, ability, spell
						}),
						list: new fields.ArrayField(new fields.StringField()),
						query: new fields.StringField({}),
						chosen: new fields.StringField({}),
					}),
				})
			)
		});
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