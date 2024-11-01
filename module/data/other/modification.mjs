/**
 * Data schema, attributes, and methods specific to Modification type ActiveEffects.
 */
export default class Modification extends foundry.abstract.TypeDataModel {
	static _RESOURCES = {
		hp: { id: "hp", label: "SKYFALL.ACTOR.RESOURCES.HP" },
		ep: { id: "ep", label: "SKYFALL.ACTOR.RESOURCES.EP" },
		catharsis: { id: "catharsis", label: "SKYFALL.ACTOR.RESOURCES.CATHARSIS" },
		shadow: { id: "shadow", label: "SKYFALL.ACTOR.RESOURCES.SHADOW" },
		cunning: { id: "cunning", label: "SKYFALL2.GUILD.Cunning" },
		knowledge: { id: "knowledge", label: "SKYFALL2.GUILD.Knowledge" },
		crafting: { id: "crafting", label: "SKYFALL2.GUILD.Crafting" },
		reputation: { id: "reputation", label: "SKYFALL2.GUILD.Reputation" },
	}

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
			specialDuration: new fields.StringField({
				required: true,
				blank:true,
				choices:{
					scene: {
						id:'scene', value:'scene',
						label: 'SKYFALL2.DURATION.Scene'
					},
					concentration: {
						id:'concentration', value:'concentration',
						label: 'SKYFALL2.DURATION.Concentration'
					}
				},
				initial: '',
				label:"SKYFALL2.DURATION.Special"
			}),
			apply: new fields.SchemaField({
				always: new fields.BooleanField({required: true, initial:false, label: "SKYFALL.MODIFICATION.APPLYALWAYS"}),
				itemName: new fields.StringField({required:true, blank: true, label: "SKYFALL.MODIFICATION.ITEMNAME"}),
				itemType: new fields.ArrayField(new fields.StringField({required:true, blank: true}), {label: "SKYFALL.MODIFICATION.ITEMTYPE"}),
				descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, }), {initial: () => ([]), label: "SKYFALL.MODIFICATION.DESCRIPTOR"}),
				type: new fields.ArrayField(new fields.StringField({
						required: true,
						choices: {
							shallow: {id: 'shallow', value: 'shallow', label: "SKYFALL2.SPELL.LAYER.Shallow"},
							deep: {id: 'deep', value: 'deep', label: "SKYFALL2.SPELL.LAYER.Deep"},
							add: {id: 'add', value: 'add', label: 'SKYFALL2.MODIFICATION.TYPE.Add'},
							modify: {id: 'modify', value: 'modify', label: 'SKYFALL2.MODIFICATION.TYPE.Modify'},
							remove: {id: 'remove', value: 'remove', label: 'SKYFALL2.MODIFICATION.TYPE.Remove'},
							amplify: {id: 'amplify', value: 'amplify', label: 'SKYFALL2.MODIFICATION.TYPE.Amplify'},
						}
					}), {
				}),
				amplifyThreshold: new fields.NumberField({
					required: true,
					integer: true,
					initial: 15,
					label: "SKYFALL2.MODIFICATION.TYPE.Amplify"
				}),
			}),
			cost: new fields.SchemaField({
				value: new fields.NumberField({required: true, integer: true, initial:0, label: "SKYFALL.ITEM.ABILITY.COST"}),
				resource: new fields.StringField({required: true, blank: false, choices: this._RESOURCES, initial: "ep", label: "SKYFALL.RESOURCE"}),
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