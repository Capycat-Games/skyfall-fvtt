
export default class RollModifiersField extends foundry.data.fields.ArrayField {
	/* -------------------------------------------- */
	/*  Active Effect Integration                   */
	/* -------------------------------------------- */

	/** @override */
	_applyChangeAdd(value, delta, model, change) {
		// value.push(...delta);
		value.push( change );
		return value;
	}
}