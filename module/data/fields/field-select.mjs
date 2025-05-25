export default class SelectField extends foundry.data.fields.StringField {
	
	_applyChangeAdd(value, delta, model, change) {
		if ( !Number(delta) ) return value;
		const choices = Object.values(this.choices);
		const current = choices.findIndex( i => i.id == value || i == value );
		console.log(choices, value, current);
		if ( current == -1 ) return value;
		const deltaChoice = choices.at(current + Number(delta));
		//.find( i => i.index == (current + Number(delta)) );
		if ( !deltaChoice ) return value;

		if ( deltaChoice.id ) return deltaChoice.id;
		else return deltaChoice;
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