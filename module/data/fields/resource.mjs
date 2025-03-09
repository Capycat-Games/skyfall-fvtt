

export default class ResourceField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		fields = {
			value: new foundry.data.fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL2.Current"}),
			max: new foundry.data.fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL2.Total"}),
			temp: new foundry.data.fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.TemporaryAbbr"}),
			...fields
		};
		super(fields, { label: "SKYFALL2.Resource", ...options });
	}
	

	get negative(){
		return  false; // ( this.fields.value.value < 0 );
	}

	get pct(){
		return  false; // Math.round((progress.loaded + progress.failed) * 100 / progress.total);
	}
	get tpct(){
		return  false; // Math.round((progress.loaded + progress.failed) * 100 / progress.total);
	}
}