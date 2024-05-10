class DescriptorsField extends foundry.data.fields.ArrayField {
	/* -------------------------------------------- */
	/*  Form Field Integration                      */
	/* -------------------------------------------- */

	/** @override */
	_toInput(config) {
		const e = this.element;

		// Arbitrary String Tags
		if ( e instanceof foundry.data.fields.StringField ) return foundry.applications.elements.HTMLStringTagsElement.create(config);
	}
}

export const fields = Object.freeze({
	DescriptorsField: DescriptorsField
});