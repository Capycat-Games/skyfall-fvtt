import { SYSTEM } from "../config/system.mjs";
import SkyfallSheetMixin from "./skyfall-sheet.mjs";

/**
 * A sheet application for displaying and configuring Items with the Ancestry type.
 * @extends ItemSheet
 * @mixes SkyfallSheet
 */
export default class SkyfallItemSheet extends SkyfallSheetMixin(ItemSheet) {
	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			dragDrop: [{dragSelector: 'draggable', dropSelector: ".list-items.drop"}]
		});
	}

	get template(){
		if ( ['ability','spell'].includes(this.item.type) ) return `systems/skyfall/templates/item/ability-sheet.hbs`;
		return `systems/skyfall/templates/item/item-sheet.hbs`;
		return `systems/skyfall/templates/item/${this.item.type}.hbs`;
	}

	get enrichmentOptions() {
		return {
			secrets: this.item.isOwner, async: true, relativeTo: this.item, rollData: {}
		};
	}

	async getData() {
		const context = super.getData();
		context.user = game.user;
		context.SYSTEM = SYSTEM;
		context.system = this.item.system;
		context.tabs = {}
		context.isEditable = this.isEditable;
		context.isEditing = this.isEditing;
		context.partials = {
			type: null, 
			description: "systems/skyfall/templates/item/parts/description.hbs",
		}
		// Enrich HTML description
		context.enriched = {
			description: await TextEditor.enrichHTML(context.system.description.value, this.enrichmentOptions),
		}
		switch( this.item.type ) {
			case 'loot':
				context.tabs.description = "SKYFALL.DESCRIPTION";
				context.partials.description = "systems/skyfall/templates/item/parts/description-physical.hbs";
				break
			case 'weapon':
			case 'armor':
			case 'clothing':
			case 'consumable':
			case 'equipment':
				await this.getEquipmentData(context);
				break;
			case 'legacy':
				await this.getLegacyData(context);
				break;
			case 'background':
				await this.getBackgroundData(context);
				break;
			case 'class':
				await this.getClassData(context);
				break;
			case 'path':
				await this.getPathData(context);
				break;
			case 'feature':
			case 'curse':
			case 'feat':
				await this.getFeatureData(context);
				break;
			case 'ability':
			case 'spell':
				await this.getAbilityData(context);
				break;
		}
		await this.getListData(context);
		console.log(context);
		return context;
	}

	async getListData(context) {
		// Features, Feats, Abilities
		for (const category of ["features", "featuresAdv", "feats", "abilities"]) {
			context[category] = [];
			if ( !( category in context.system ) ) continue;
			for (const uuid of context.system[category]) {
				const item = await fromUuid(uuid);
				if ( !item ) continue;
				context[category].push({
					uuid: item.uuid,
					name: item.name,
					img: item.img,
					description: item.system.description.value
				})
			}
		}
	}
	
	async getEquipmentData(context) {
		context.partials.description = "systems/skyfall/templates/item/parts/description-physical.hbs";
		context.partials.type = "systems/skyfall/templates/item/parts/equipment.hbs";
		context.tabs = {
			description: "SKYFALL.DESCRIPTION",
			traits: "SKYFALL.ITEM.LEGACY.TRAITS",
			effects: "SKYFALL.SHEET.EFFECTS",
		}
		if ( context.system.unidentified.value ) {
			context.enriched.description = await TextEditor.enrichHTML(context.system.unidentified.description, this.enrichmentOptions);
		}
		this.getDescriptors(context, "equipment");
	}

	async getLegacyData(context) {
		// Rendering Data
		context.partials.type = "systems/skyfall/templates/item/parts/legacy.hbs";
		context.tabs = {
			// description: "SKYFALL.DESCRIPTION",
			traits: "SKYFALL.ITEM.LEGACY.TRAITS",
			features: "SKYFALL.ITEM.FEATURES",
			heritage: "SKYFALL.ITEM.LEGACY.HERITAGE",
			feats: "SKYFALL.ITEM.FEATS",
			effects: "SKYFALL.SHEET.EFFECTS",
		}
		context.enriched.age = await TextEditor.enrichHTML(context.system.traits.age, this.enrichmentOptions);
		context.enriched.movement = await TextEditor.enrichHTML(context.system.traits.movement, this.enrichmentOptions);
		context.enriched.size = await TextEditor.enrichHTML(context.system.traits.size, this.enrichmentOptions);
		context.enriched.melancholy = await TextEditor.enrichHTML(context.system.traits.melancholy, this.enrichmentOptions);

		// Heritage
		context.heritage = false;
		context.heritages = [];
		for (const [key, value] of Object.entries(this.item.system.heritages)) {
			const heritage = {
				key: key,
				name: value.name,
				chosen: value.chosen,
				description: value.description,
				features: []
			};
			for (const uuid of value.features) {
				const item = await fromUuid(uuid);
				if ( !item ) continue;
				heritage.features.push({
					uuid: item.uuid,
					name: item.name,
					img: item.img,
					description: item.system.description
				});
			}
			context.heritages.push(heritage);

			if ( value.chosen ) context.heritage = key;
		}
	}

	async getBackgroundData(context) {
		context.partials.description = null;
		context.partials.type = "systems/skyfall/templates/item/parts/background.hbs";
		context.tabs = {
			description: "SKYFALL.DESCRIPTION",
			// features: "SKYFALL.ITEM.FEATURES",
			effects: "SKYFALL.SHEET.EFFECTS",
		}
	}
	
	async getClassData(context) {
		context.partials.type = "systems/skyfall/templates/item/parts/class.hbs";
		context.tabs = {
			traits: "SKYFALL.ITEM.LEGACY.TRAITS",
			features: "SKYFALL.ITEM.FEATURES",
			feats: "SKYFALL.ITEM.FEATS",
			effects: "SKYFALL.SHEET.EFFECTS",
		}
		context.hitDies = ['1d6', '1d8', '1d10'];
	}
	
	async getPathData(context) {
		// Rendering Data
		context.partials.description = null;
		context.partials.type = "systems/skyfall/templates/item/parts/path.hbs";
		context.tabs = {
			description: "SKYFALL.DESCRIPTION",
			features: "SKYFALL.ITEM.FEATURES",
			feats: "SKYFALL.ITEM.FEATS",
			effects: "SKYFALL.SHEET.EFFECTS",
		}
	}

	async getFeatureData(context) {
		// Rendering Data
		if ( context.item.type == 'curse' ) {
			context.tabs = {
				description: "SKYFALL.DESCRIPTION",
				features: "SKYFALL.ITEM.FEATURES",
				feats: "SKYFALL.ITEM.FEATS",
				effects: "SKYFALL.SHEET.EFFECTS",
			}
		} else {
			context.tabs = {
				description: "SKYFALL.DESCRIPTION",
				abilities: "SKYFALL.ITEM.ABILITIES" ,
				effects: "SKYFALL.SHEET.EFFECTS",
			}
		}
	}

	
	async getAbilityData(context) {
		// Rendering Data
		context.partials.type = "systems/skyfall/templates/item/parts/ability.hbs";
		context.partials.description = null;
		context.labels = context.system._labels;
		this.getDescriptors(context);
		
		if ( context.item.type == 'spell' ) {
			context.components = context.system.components.reduce((acc, key) => {
				acc[key] = true;
				return acc;
			}, {});
		}

		context.modifications = [
			{
				cost: 0, resource:'ep', type: "[AMPLIAR 15+]",
				changes: [
					{label:"Efeito", descriptive: "o alvo fica Desprotegido (físico) até o início da próxima rodada."},
				]
			},
			{
				cost: 1, resource:'ep', type: "[AMPLIAR 15+]",
				changes: [
					{label:"Alvo", descriptive: "criaturas em uma esfera de 3 m (2 q) de raio."},
				]
			},
		]
	}


	async getDescriptors(context, type) {
		context.descriptors = context.system.descriptors.reduce((acc, key) => {
			acc[key] = true;
			return acc;
		}, {});
		
		const _descriptors = [ ...context.system.descriptors , ...Object.keys(SYSTEM.DESCRIPTORS) ];
		context.descriptors = _descriptors.reduce((acc, key) => {
			if ( !SYSTEM.DESCRIPTORS[key]?.type.includes(type) ) return acc;
			acc[key] = {
				value: (context.system.descriptors.includes(key)),
				...SYSTEM.DESCRIPTORS[key] ?? {
					id: key, hint: "", type: "origin", label: key.toUpperCase(),
				}
			}
			return acc;
		}, {});
	}

	/** @inheritdoc */
	async _updateObject(event, formData) {
		if ( formData['system.descriptors'] ) formData['system.descriptors'] = formData['system.descriptors'].filter(Boolean);
		if ( formData['_descriptor'] ) {
			formData['system.descriptors'] = [formData['_descriptor'], ...formData['system.descriptors']];
		}
		// console.log( event, formData );
		return super._updateObject(event, formData);
	}
}