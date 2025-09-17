const TextEditor = foundry.applications.ux.TextEditor.implementation;
const {renderTemplate} = foundry.applications.handlebars;

/**
 * Data schema, attributes, and methods specific to Spell type Items.
 */
export default class Sigil extends foundry.abstract.TypeDataModel {
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
				choices: {prefix:"SKYFALL2.SIGIL.Prefix", sufix:"SKYFALL2.SIGIL.Sufix"},
				initial: "prefix",
				label: "SKYFALL2.Type"
			}),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL.DESCRIPTORS"})),
			charges: new fields.SchemaField({
				value: new fields.NumberField({
					required:true,
					integer: true,
					min: 0,
					initial: 1,
					label: "SKYFALL2.Charge",
				}),
				max: new fields.NumberField({
					required:true,
					integer: true,
					min: 1,
					initial: 1,
				}),
			}),
			activation: new fields.SchemaField({
				type: new fields.StringField({required: true, choices:SYSTEM.activations, initial: 'action', label: "SKYFALL2.ACTIVATION.Type"}),
			}, {label: "SKYFALL2.Activation"}),
			effect: new fields.SchemaField({
				descriptive: new fields.HTMLField({required: true, blank: true, label: "SKYFALL2.Description"}),
			}),
			fragments: new fields.SchemaField({
				value: new fields.BooleanField({
					initial: false,
					label: "SKYFALL2.Infused",
				}),
				amount: new fields.NumberField({
					required:true,
					integer: true,
					initial: 1,
					label: "SKYFALL2.Quantity"
				}),
				type: new fields.StringField({
					required: true,
					blank: true,
					choices: {permanent:"SKYFALL2.Permanent", recharge:"SKYFALL2.Recharge"},
					initial: "permanent",
					label: "SKYFALL2.Type",
				}),
			}),
			item: new fields.StringField({required: true, label:"SKYFALL2.Item", validate: Sigil.validateUuid}),
		};
	}

	/**
	 * Validate that each entry in the talents Set is a UUID.
	 * @param {string} uuid     The candidate value
	 */
	static validateUuid(uuid) {
		return true;
		const {documentType, documentId} = foundry.utils.parseUuid(uuid);
		if ( CONST.DOCUMENT_TYPES.includes(documentType) || !foundry.data.validators.isValidId(documentId) ) {
			throw new Error(`"${uuid}" is not a valid UUID string`);
		}
	}

	getRollData() {
		return {};
	}
	/* ---------------------------------------- */
	/*  GETTERS                                 */
	/* ---------------------------------------- */
	
	get action() {
		return this.activation.type;
	}

	get infused(){
		return this.fragments.value;
	}

	get labels(){
		const labels = {};
		// ACTIVATION
		const actions = new Set(['action','bonus','reaction','free']);
		labels.action = {
			label: SYSTEM.activations[this.action].label,
			icon: actions.has(this.action) ? SYSTEM.icons[`sf${this.action}`] : SYSTEM.icons.sfmaction
		}
		if ( this.charges && (!this.infused && this.fragments.type == "permanent") ) {
			labels.charges ??= {};
			labels.charges = {
				label: `SKYFALL2.ChargePl`,
				descriptive: `${this.charges.value}/${this.charges.max}`,
			};
		}
		if ( this.effect.descriptive ) {
			labels.effect = {
				label: `SKYFALL.ITEM.ABILITY.EFFECT`,
				descriptive: this.effect.descriptive,
			};
		}
		if ( this.fragments ) {
			const pl = this.fragments.amount > 1 ? "Pl" : "";
			const type = game.i18n.format(
				`SKYFALL2.FRAGMENT.${this.fragments.type.titleCase()}`, {
				action: `${labels.action.icon} ${labels.action.label}`
			});
			const formatData = {
				amount: this.fragments.amount,
				fragments: game.i18n.localize(`SKYFALL2.Fragment${pl}`),
				type: type
			}

			labels.fragments = {
				label: game.i18n.localize("SKYFALL2.FRAGMENT.Infusing"),
				descriptive: game.i18n.format("SKYFALL2.FRAGMENT.Infuse", formatData)
			};
		}
		
		// Descriptors
		if ( this.descriptors.length ){
			labels.descriptors =  skyfall.utils.descriptorsTags(this.descriptors, {sigil: true});
		}
		if ( this.item ) {
			labels.equipment = fromUuidSync(this.item);
			labels.equipment.magicName = labels.equipment.magicName ?? labels.equipment.name;
		}
		return labels;
	}

	get rank(){
		let rank = this.descriptors.find( i => SYSTEM.SIGILDESCRIPTOR.RANK[i] )?.replace(/\D/gi,'');
		rank = Number( rank ) ;
		return rank ?? 1;
	}

	get equipment(){
		return this.descriptors.find( i => SYSTEM.SIGILDESCRIPTOR.GEAR[i] );
	}

	get clothing(){
		return this.descriptors.find( i => SYSTEM.SIGILDESCRIPTOR.CLOTHING[i] );
	}

	async prepareCardData(options = {}){
		const card = {};
		
		const labelDescription = (name, text) => {
			const div = document.createElement("div");
			const label = document.createElement("label");
			div.innerHTML = text;
			label.innerText = `${name}: `;
			div.querySelector("p")?.prepend(label);
			return div.innerHTML;
		}

		// Name
		const PREFIX = this.type == "prefix" ? "— " : "";
		const SUFIX = this.type == "sufix" ? "— " : "";
		card.name = `${PREFIX}${this.parent.name}${SUFIX}`;
		
		// Action icon
		card.action = SYSTEM.icons[`sf${this.activation.type}`];

		// Descriptors
		card.descriptors = this.descriptors;
		if ( !this.infused && this.fragments.type == "permanent" ) {
			card.charges = {
				label: game.i18n.localize("SKYFALL2.ChargePl"),
				value: this.charges.value,
				max: this.charges.max,
			}
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
		
		
		// Fragments
		{
			const pl = this.fragments.amount > 1 ? "Pl" : "";
			const type = game.i18n.format(
				`SKYFALL2.FRAGMENT.${this.fragments.type.titleCase()}`, {
				action: `${card.action} ${SYSTEM.activations[this.action].label}`
			});
			const formatData = {
				amount: this.fragments.amount,
				fragments: game.i18n.localize(`SKYFALL2.Fragment${pl}`),
				type: type
			}
	
			card.fragments = {
				label: game.i18n.localize("SKYFALL2.FRAGMENT.Infusing"),
				value: game.i18n.format("SKYFALL2.FRAGMENT.Infuse", formatData)
			};

		}
		if ( this.item ) {
			card.equipment = fromUuidSync(this.item);
			card.equipment.magicName = card.equipment.magicName ?? card.equipment.name;
		}
		
		return card;
	}

	async renderCardTemplate(options){
		const card = await this.prepareCardData(options);
		const cardTemplate = "systems/skyfall/templates/v2/item/sigil-card-v2.hbs";
		const templateData = {
			card: card,
			SYSTEM: SYSTEM,
			item: this.parent,
			renderAt: options.renderAt ?? "ItemSheet",
			anchor: this.parent.toAnchor().outerHTML,
			collapse: true,
		}
		if ( game.version.startsWith('13') ){
			let template = await foundry.applications.handlebars.renderTemplate(cardTemplate, templateData);
			template = await TextEditor.enrichHTML(template, {
				async: true, relativeTo: this.parent,
			});
			return template;
		} else {
			let template = await renderTemplate(cardTemplate, templateData);
			template = await TextEditor.enrichHTML(template, {
				async: true, relativeTo: this.parent,
			});
			return template;
		}
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */
	
	_onUpdate(changed, options, userId) {
		super._onUpdate(changed, options, userId);
		if ( this.parent._enriched ) this.parent._enriched = null;
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
		const cardTemplate = "systems/skyfall/templates/v2/item/sigil-card-v2.hbs";
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
