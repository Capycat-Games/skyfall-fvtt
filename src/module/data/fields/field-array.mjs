/**
 * 
 */

// import ActorConfigurationSheet from "../../app/sheets/actor-config.mjs";

export default class ArrayField extends foundry.data.fields.ArrayField {
	/* -------------------------------------------- */
	/*  Getters/Setters                             */
	/* -------------------------------------------- */

	get document () {
		let parent = this.rootDocument ?? this.parent;
		while ( parent ) {
			if ( parent.documentName ) break;
			parent = parent.rootDocument ?? parent.parent;
		}
		return parent;
	}

	get sheet(){
		console.log(this);
		// return new ActorConfigurationSheet({
		// 	document: this.document,
		// 	fieldPath: this.fieldPath,
		// 	skyfallConfig: {
		// 		schema: this,
		// 	},
		// 	skyfallConfigParts: [this.name],
		// }).render(true);
	}

	
	/* -------------------------------------------- */
	/*  System Operations                           */
	/* -------------------------------------------- */

	_onCreate(document, target) {
		const { fieldPath } = target.dataset;
		const current = foundry.utils.getProperty(
			document.toObject(true), fieldPath
		);

		const updateData = {}
		switch (this.name) {
			case "proficiencies": {
				const input = target.closest("div").querySelector('input');
				if( !input.value ) return;
				current.push(input.value);
			}
			default:
				break;
		}
		updateData[fieldPath] = current;
		return document.update(updateData);
	}

	
	/** @override */
	_toInput(config) {
		config.value ??= this.initial;
		const choices = foundry.utils.mergeObject({}, this.options.choices);
		const inputConfig = {};
		if ( this.options.custom ) {
			const keys = Object.keys(choices);
			config.value.filter( i => !keys.includes(i) )
				.map( i => choices[i] = i );
		}
		console.log(choices);
		Object.assign(inputConfig, {
			name: this.fieldPath,
			options: Object.entries(choices)
				.reduce((acc, i) => {
					const key = i[0];
					const label = i[1];
					console.log(choices, key, label);
					acc.push({
							value: key,
							// i.id ?? i.value ?? i,
							//i[0],
							label: game.i18n.localize(label),
							//game.i18n.localize(i.label ?? i.name ?? i),
							//game.i18n.localize(i[1]),
							// group: i.group ?? null, //
						});
						return acc;
				}, []),
			value: config.value,
			type: this.options.type ?? "checkboxes"
		});
		console.log(inputConfig);
		return foundry.applications.fields.createMultiSelectInput(inputConfig);
	}


	
}