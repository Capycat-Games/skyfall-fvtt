
export default class Template extends foundry.abstract.DataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		
		return {
			bonuses: new _fields.RollModifiersField(new fields.SchemaField({
				someTest: new fields.StringField({required:true,blank:true,initial:'TEST'}),
			}))
		}
	}
}