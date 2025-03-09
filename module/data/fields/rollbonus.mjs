
export default class RollBonusField extends foundry.data.fields.ArrayField {
	/* -------------------------------------------- */
	/*  Active Effect Integration                   */
	/* -------------------------------------------- */
	
	/** @override */
	_applyChangeAdd(value, delta, model, change) {
		const dataRgx = new RegExp(/@(?<data>[a-zA-Z.0-9_-]+)/i);
		const flavorRgx = new RegExp(/\[(?<flavor>[a-zA-Z.0-9_-|\s]+)\]/i);
		const [val, desc] = change.value.split(';').map( i => i.trim());
		let terms = [val];
		terms = terms.map( (term) => {
			let data = term.match(dataRgx)?.groups?.data ?? "";
			let flavor = term.match(flavorRgx)?.groups?.flavor ?? "";
			let arr = flavor.split('|');
			arr[0] ??= "";
			arr[1] ??= data ?? "";
			arr[2] ??= change.effect.parent.documentName == 'Item' ? change.effect.parent.name : change.effect.name;
			if ( !term.match(flavorRgx) ) {
				term = `${term}[${arr.join('|')}]`;
			} else {
				term = term.replace(flavorRgx, `[${arr.join('|')}]`);
			}
			return term;
		});
		value.push( {
			value: terms.join('+'),
			descriptors: desc,
		} );
		return value;
	}
}