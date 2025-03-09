

export default class SkyfallEffectData extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		
		return {
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
				label: "SKYFALL2.DURATION.Special"
			}),
			stackable: new fields.BooleanField({
				initial: false,
				label: "SKYFALL2.Stackable"
			}),
			stack: new fields.NumberField({
				initial: 0,
				label: "SKYFALL2.Stack"
			}),
			group: new fields.ObjectField({
				required: false,
				initial: undefined
			}),
			transfer: new fields.StringField({
				blank: false,
				choices: {
					"actor": "Actor",
					"item": "Item",
					"target-actor": "Actor alvo",
					"target-item": "Item alvo",
				},
				initial: "actor",
				label: "SKYFALL2.TranferMode",
			}),
		}
	}
}