const TextEditor = foundry.applications.ux.TextEditor.implementation;
const {renderTemplate} = foundry.applications.handlebars;
/**
 * Data schema, attributes, and methods specific to Spell type Items.
 */
export default class GuildAbility extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			identifier: new fields.StringField({
				required: true,
				initial: '',
				label: "SKYFALL2.Identifier",
			}),
			type: new fields.StringField({
				required: true,
				blank: true,
				choices: {
					cunning: {value:'cunning', label:"SKYFALL2.GUILD.Cunning"},
					knowledge: {value:'knowledge', label:"SKYFALL2.GUILD.Knowledge"},
					crafting: {value:'crafting', label:"SKYFALL2.GUILD.Crafting"},
					reputation: {value:'reputation', label:"SKYFALL2.GUILD.Reputation"},
				},
				initial: "cunning",
				label: "SKYFALL2.Ability"
			}),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL.DESCRIPTORS"})),
			activation: new fields.SchemaField({
				type: new fields.StringField({required: true, initial: 'action', label: "SKYFALL2.ACTIVATION.Type"}),
				cost: new fields.NumberField({required: true, label: "SKYFALL2.GUILD.GuildActionPl"}),
			}, {label: "SKYFALL2.Activation"}),
			effect: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
			}),
			special: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
			}),
			consume: new fields.SchemaField({
				amount: new fields.NumberField({required: true, integer: true, label: "SKYFALL2.Cost"}),
			}, {label: "SKYFALL2.Consume"})
		};
	}

	/* ---------------------------------------- */
	/*  GETTERS                                 */
	/* ---------------------------------------- */
	
	get action() {
		return this.activation.type;
	}

	get labels(){
		const labels = {};
		// ACTIVATION
		const actions = new Set(['action','bonus','reaction','free']);
		labels.action = {
			label: SYSTEM.activations[this.action].label,
			icon: actions.has(this.action) ? SYSTEM.icons[`sf${this.action}`] : SYSTEM.icons.sfmaction
		}
		// ICON
		labels.type = { icon: SYSTEM.icons[`sf${this.type}`] }
		// Actions Cost
		if ( this.activation.cost ) {
			labels.cost = this.activation.cost;
		}
		labels.properties = {};
		if ( this.consume.amount ) {
			labels.properties.cost = {
				label: "SKYFALL.ITEM.ABILITY.COST",
				descriptive: game.i18n.format('{value} {resource}', {
					value: this.consume.amount,
					resource: game.i18n.localize(`SKYFALL2.GUILD.${this.type.titleCase()}Points`),
				}),
			}
		} else {
			labels.properties.cost = {
				label: "SKYFALL.ITEM.ABILITY.COST",
				descriptive: game.i18n.localize('SKYFALL2.Special'),
			}
		}

		if ( this.effect.descriptive ) {
			labels.effect = {
				label: "SKYFALL.ITEM.ABILITY.EFFECT",
				descriptive: this.effect.descriptive,
			}
		} else {}

		if ( this.special.descriptive ) {
			labels.special = {
				label: "SKYFALL.ITEM.ABILITY.SPECIAL",
				descriptive: this.special.descriptive,
			}
		} else {}
		
		// Descriptors
		if ( this.descriptors.length ){
			labels.descriptors =  skyfall.utils.descriptorsTags(this.descriptors, {sigil: true});
		}
		return labels;
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		this.descriptors = ['guild', this.type]
	}

	/** @inheritDoc */
	prepareDerivedData() {
	}
	
	
	async prepareCardData(options = {}){
		const card = {};
		
		// Name
		card.abilityIcon = SYSTEM.icons[`sf${this.type}`];;
		
		// Action icon
		card.action = SYSTEM.icons.sfaction;
		card.cost = this.activation.cost;

		// Descriptors
		card.descriptors = this.descriptors;

		const labelDescription = (name, text) => {
			const div = document.createElement("div");
			const label = document.createElement("label");
			div.innerHTML = text;
			label.innerText = `${name}: `;
			div.querySelector("p")?.prepend(label);
			return div.innerHTML;
		}
		// Resources
		if ( this.consume.amount ) {
			const label = game.i18n.localize("SKYFALL2.Cost");
			const value = game.i18n.format('{value} {resource}', {
				value: this.consume.amount,
				resource: game.i18n.localize(`SKYFALL2.GUILD.${this.type.titleCase()}Points`),
			});
			card.resources = labelDescription(label, `<p>${value}</p>`);
			
		} else {
			const label = game.i18n.localize("SKYFALL2.Cost");
			const value = game.i18n.localize('SKYFALL2.Special');
			card.resources = labelDescription(label, `<p>${value}</p>`);
		}

		if ( this.effect.descriptive ) {
			const label = game.i18n.localize("SKYFALL.ITEM.ABILITY.EFFECT");
			const value = await TextEditor.enrichHTML(
				this.effect.descriptive, {
				async: true,
				relativeTo: this.parent,
			});
			card.effect = labelDescription(label, value);
		}

		if ( this.special.descriptive ) {
			const label = game.i18n.localize("SKYFALL.ITEM.ABILITY.SPECIAL");
			const value = await TextEditor.enrichHTML(
				this.special.descriptive, {
				async: true,
				relativeTo: this.parent,
			});
			card.special = labelDescription(label, value);
		}
		
		return card;
	}


	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */

	
	async toEmbed(config, options={}) {
		config.classes = "ability-embed skyfall sheet";
		config.cite = false;
		config.caption = false;
		// let modifications = this.parent.effects.filter(ef => ef.type == "modification" && !ef.isTemporary).map(ef => `@EMBED[${ef.uuid}]`);

		const anchor = this.parent.toAnchor();
		anchor.classList.remove('content-link');
		anchor.querySelector('i').remove();
		const templateData = {
			card: await this.prepareCardData(options),
			SYSTEM: SYSTEM,
			document: this.parent,
			item: this.parent,
			system: this,
			anchor: anchor.outerHTML,
			isPlayMode: true,
			isEmbed: true,
			isFigure: config.isFigure ?? true,
			embeddedAt: config.embeddedAt ?? "Embedded", //isSheetEmbedded,
			collapse: config.collapse ?? false,
			enriched: [],
			// modifications: modifications.join(''),
		}
		let abilityCard;
		const cardTemplate = "systems/skyfall/templates/v2/item/guild-ability-card-v2.hbs";
		// const cardTemplate = "systems/skyfall/templatesV13/item/ability/guild-card.hbs";
		if ( game.version.startsWith('13') ){
			abilityCard = await foundry.applications.handlebars.renderTemplate(cardTemplate, templateData);
		} else {
			abilityCard = await renderTemplate(cardTemplate, templateData);
		}
		
		const container = document.createElement("div");
		container.innerHTML = await TextEditor.enrichHTML(abilityCard, {
			async: true, relativeTo: this.parent,
		});
		return container.firstChild;
	}

	/**
	 * 
	 * @param {*} config 
	 * @param {*} options 
	 * @returns 
	 */
	async _embed(config, options={}) {
		const container = document.createElement("div");
		container.innerHTML = `
			<div class="ability-header">
				<span>action</span>
				<h5>NOME<h5>
				<a data-action="someAction">SOMEACTION</a>
			</div>
			<div class="modification-description">
				${this.name}
			</div>
		`;
		return container.children;
	}

	getRollData() {
		return {}
	}

	
	async abilityUse(event, item){
		const ability = this.document ?? this.parent;
		if ( !ability || !ability.actor ) return;
		
		const { ModificationConfig } = skyfall.applications;
		const MODCONFIG = await ModificationConfig.fromData({
				actor: ability.actor.uuid,
				ability: ability.id,
				weapon: item?.id,
				appliedMods: [],
				rollconfig: {
					rollmode: (event.altKey ? 'disadvantage' : (event.ctrlKey ? 'advantage' : null)),
				},
				effects: ability.effects.filter( e => e.isTemporary),
		});

		const skipUsageConfig = game.settings.get('skyfall','skipUsageConfig');
		const skip = ( skipUsageConfig=='shift' && event.shiftKey) || ( skipUsageConfig=='click' && !event.shiftKey);
		if ( skip ) {
			const message = await MODCONFIG.createMessage();
			message.evaluateAll();
			message.consumeResources();
		} else {
			MODCONFIG.render(true);
		}
	}
}
