export default class SelectField extends foundry.data.fields.StringField {
	
	_applyChangeAdd(value, delta, model, change) {
		if ( !Number(delta) ) return value;
		const choices = Object.values(this.choices);
		const current = choices.find( i => i.id == value );
		if ( !current ) return value;
		const deltaChoice = choices.find( i => i.index == (current.index + Number(delta)) );
		if ( !deltaChoice ) return value;
		return deltaChoice.id;
	}

	/** @override */
	_applyChangeUpgrade(value, delta, model, change) {
		const choices = Object.values(this.choices);
		const current = choices.indexOf(value); // ( i => i.id == value );
		const upgraded = choices.indexOf(delta); //find( i => i.id == delta );
		return upgraded > current ? delta : value;
	}

	/** @override */
	_applyChangeDowngrade(value, delta, model, change) {
		const choices = Object.values(this.choices);
		const current = choices.indexOf(value); // ( i => i.id == value );
		const upgraded = choices.indexOf(delta); //find( i => i.id == delta );
		return upgraded < current ? delta : value;
	}
}