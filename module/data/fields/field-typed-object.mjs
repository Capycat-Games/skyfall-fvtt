import { v13TypedObjectField } from "./_field-typed-object.mjs";

export default class TypedObjectField extends v13TypedObjectField {
	constructor(element, options= {mergeInitial: false}) {
		if ( options.mergeInitial ) {
			for ( const key in options.initial ) {
				options.initial[key] = {
					...element.getInitialValue(),
					...options.initial[key],
				}
				options.name = key;
			}
		}
		super(element, options);
	}

	/** @override */
	initialize(value, model, options={}) {
		const object = {};
		for ( const key in value ) object[key] = this.element.initialize(value[key], model, options);
		return object;
	}

}