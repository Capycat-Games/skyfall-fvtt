import * as widgets from "./helpers/widgets.mjs";

export default class SkyfallModificationConfig extends ActiveEffectConfig {
	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["skyfall", "sheet", "modification"],
			// width: 800,
			height: 'auto',
			// height: 700,
			// resizable: true,
			submitOnChange: true,
			closeOnSubmit: false,
		});
	}
	
	
	/** @override */
	get title() {
		const {documentName, type, name} = this.object;
		// const typeLabel = type.titleCase();
		const typeLabel = game.i18n.localize(`TYPES.ActiveEffect.${type.titleCase()}`);
		return `[${typeLabel}] ${name}`;
	}

	/** @override */
	get template() {
		return "systems/skyfall/templates/apps/modification.hbs";
	}

	/** @override */
	async getData() {
		const context = await super.getData();
		context.system = this.document.system.toObject();
		console.log(context);
		console.log(widgets);
		if ( context.system?.apply?.itemType ) {
			context.system.apply.itemType = context.system.apply.itemType.filter(Boolean).reduce( (acc, k) => {
				acc[k] = true;
				return acc;
			}, {})
		}
		// context.widgets = widgets;
		this.getDescriptors(context);
		this.#getSystemFields(context);
		// context.specialDurations = {scene:"Cena"};
		return context;
	}

	#getSystemFields(context) {
		let system = this.object.system.toObject();
		const schema = this.object.system.schema;
		system = foundry.utils.flattenObject(system);
		
		for (const path of Object.keys(system)) {
			system[path] = schema.getField(path);
		}
		context.systemFields = foundry.utils.expandObject(system);
	}

	async getDescriptors(context, type) {
		context.descriptors = context.system.apply.descriptors.reduce((acc, key) => {
			acc[key] = true;
			return acc;
		}, {});
		// if ( !type ) type = '*';
		// getDescriptors( context, ['equipment'] )
		// getDescriptors( context, ['damage','diverse',''] )
		const _descriptors = [ ...context.system.apply.descriptors , ...Object.keys(SYSTEM.DESCRIPTORS) ];
		context.descriptors = _descriptors.reduce((acc, key) => {
			if ( type && !SYSTEM.DESCRIPTORS[key]?.type.includes(type) ) return acc;
			acc[key] = {
				value: (context.system.apply.descriptors.includes(key)),
				...SYSTEM.DESCRIPTORS[key] ?? {
					id: key, hint: "", type: "origin", label: key.toUpperCase(),
				}
			}
			return acc;
		}, {});
	}


	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		
	}

	/** @override */
	async _updateObject(event, formData) {
		formData = foundry.utils.flattenObject(formData);
		if ( formData['system.apply.itemType'] ) {
			formData['system.apply.itemType'] = formData['system.apply.itemType'].filter(Boolean);
		}
		if ( formData['system.apply.descriptors'] ) formData['system.apply.descriptors'] = formData['system.apply.descriptors'].filter(Boolean);
		if ( formData['_descriptor'] ) {
			formData['system.apply.descriptors'] = [formData['_descriptor'], ...formData['system.apply.descriptors']];
		}
		console.log(formData['system.apply.itemType']);
		console.log(formData['system.apply.descriptors']);
		console.log(formData);
		// formData['system.apply.descriptors'] = [];
		return this.object.update(formData);
	}
}