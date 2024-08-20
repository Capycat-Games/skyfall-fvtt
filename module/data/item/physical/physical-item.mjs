
/**
 * Data schema, attributes, and methods commom to PhysicalItemData type Items.
 */
export default class PhysicalItemData extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true, label:"SKYFALL.DESCRIPTION"}),
			}),
			unidentified: new fields.SchemaField({
				value: new fields.BooleanField({initial: false, label:"SKYFALL2.Unidentified"}),
				name: new fields.StringField({required:true, blank: true, label: "SKYFALL.NameUnidentified"}),
				description:  new fields.HTMLField({required: true, blank: true, label: "SKYFALL.DescriptionUnidentified"})
			}),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false}),{label:"SKYFALL.DESCRIPTORS"}),
			quantity: new fields.NumberField({required: true, integer: true, min: 0, initial:1, label:"SKYFALL.QUANTITY"}),
			price: new fields.NumberField({required: true, integer: true, min: 0, label:"SKYFALL.PRICE"}),
			capacity: new fields.NumberField({required: true, initial:1, min: 0, label:"SKYFALL.CAPACITY"}),
		}
	}

	static equippableSchema(){
		const fields = foundry.data.fields;
		return {
			equipped: new fields.BooleanField({initial: false, label:"SKYFALL2.Equipped"}),
			attuned: new fields.BooleanField({initial: false, label:"SKYFALL2.Attuned"}),
			favorite: new fields.BooleanField({initial: false, label:"SKYFALL.FAVORITE"}),
		}
	}

	static attackSchema(){
		const fields = foundry.data.fields;
		const AttackAbilities = {
			...SYSTEM.abilities,
			magic: {id: 'magic', label:'SKYFALL2.ABILITY.Spellcasting'}
		}
		return new fields.SchemaField({
			ability: new fields.StringField({
				required: true,
				blank: true,
				choices: AttackAbilities,
				initial: '',
				label: "SKYFALL2.Ability"
			}),
			bonus: new fields.StringField({
				required: true,
				blank: true,
				initial: '',
				label: "SKYFALL2.Bonus"
			}),
		}, {label: "SKYFALL2.Attack"});
	}
	
	static damageSchema(){
		const fields = foundry.data.fields;
		const AttackAbilities = {
			...SYSTEM.abilities,
			magic: {id: 'magic', label:'SKYFALL2.ABILITY.Spellcasting'}
		}
		return new fields.SchemaField({
			formula: new fields.StringField({required: true, blank: true, label:"SKYFALL2.Damage"}),
			abl: new fields.StringField({required: true, blank: false, choices: SYSTEM.abilities, initial: "str", label:"SKYFALL.ACTOR.ABILITY"}),
			die: new fields.StringField({
				required: true,
				blank: false,
				initial: '1d4',
				label: "SKYFALL2.DAMAGE.Die"
			}),
			versatile: new fields.StringField({
				required: true,
				blank: false,
				initial: '1d4',
				label: "SKYFALL2.DAMAGE.Versatile"
			}),
			ability: new fields.StringField({
				required: true,
				blank: true,
				choices: AttackAbilities,
				initial: '',
				label: "SKYFALL2.Ability"
			}),
			bonus: new fields.StringField({
				required: true,
				blank: true,
				initial: '',
				label: "SKYFALL2.Bonus"
			}),
		}, {label: "SKYFALL2.Damage"});
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
}