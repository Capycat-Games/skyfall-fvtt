

export default class RollField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		const _fields = foundry.data.fields;
		fields = {
			type: new _fields.StringField({
				choices: {
					attack: {
						id: 'attack',
						label: "SKYFALL2.Attack",
					},
					damage: {
						id: 'damage',
						label: "SKYFALL2.Damage",
					},
					ability: {
						id: 'ability',
						label: "SKYFALL2.Ability",
					},
					formula: {
						id: 'formula',
						label: "SKYFALL.Formula",
					},
				},
				label: "SKYFALL2.Type"
			}),
			label: new _fields.StringField(),
			terms: new _fields.ArrayField(new _fields.SchemaField({
				expression: new _fields.StringField(),
				flavor: new _fields.StringField(),
				data: new _fields.StringField(),
				source: new _fields.StringField(),
			})),
			protection: new _fields.StringField({
				required: true,
				blank: true,
				initial: 'str',
				choices: SYSTEM.abilities,
				label: "SKYFALL2.ABILITY.Protection"
			}),
		};
		super(fields, { label: "SKYFALL2.RollPl", ...options });
	}
	
}