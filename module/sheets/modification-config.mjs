import * as widgets from "./helpers/widgets.mjs";

export default class SkyfallModificationConfig extends foundry.applications.sheets.ActiveEffectConfig {
	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["skyfall", "sheet", "modification", "active-effect-sheet"],
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
		const typeLabel = game.i18n.localize(`TYPES.ActiveEffect.${type}`);
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
		if ( context.system?.apply?.itemType ) {
			context.system.apply.itemType = context.system.apply.itemType.filter(Boolean).reduce( (acc, k) => {
				acc[k] = true;
				return acc;
			}, {})
		}
		context._selOpts = {};
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

	async getDescriptors(context, types = []) {
		context.descriptors = context.system.apply.descriptors.reduce((acc, key) => {
			acc[key] = true;
			return acc;
		}, {});
		context.descriptors = {};
		context._selOpts['descriptors'] = {};
		
		for (const [category, descriptors] of Object.entries(SYSTEM.DESCRIPTOR)) {
			if ( types.length && !types.includes(category) ) continue;
			for (const [id, desc] of Object.entries(descriptors)) {
				context._selOpts['descriptors'][category.titleCase()] ??= {};
				context._selOpts['descriptors'][category.titleCase()][desc.id] = {
					...desc, 
					value: (context.system.apply.descriptors.includes(desc.id))
				}
			}
			foundry.utils.mergeObject(context.descriptors, context._selOpts['descriptors'][category.titleCase()]);
		}
		for (const desc of context.system.apply.descriptors) {
			if ( desc in context.descriptors ) continue;
			context._selOpts['descriptors']["Origin"][desc] = {
				id: desc, hint: "", type: ["origin"], label: desc.toUpperCase(), value: true
			}
		}
	}
	async getDescriptors2(context, type) {
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
		if ( formData['system.apply.type'] ) {
			formData['system.apply.type'] = formData['system.apply.type'].filter(Boolean);
		}
		if ( formData['system.apply.descriptors'] ) formData['system.apply.descriptors'] = formData['system.apply.descriptors'].filter(Boolean);
		if ( formData['_descriptor'] ) {
			formData['system.apply.descriptors'] = [formData['_descriptor'], ...formData['system.apply.descriptors']];
		}
		// formData['system.apply.descriptors'] = [];
		return this.object.update(formData);
	}
}