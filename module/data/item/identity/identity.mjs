/**
 * Data schema, attributes, and methods specific to Antecedente type Items.
 */
export default class Identity extends foundry.abstract.TypeDataModel {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			type: 'identity',
			unique: false,
			parentTypes: [],
			benefitTypes: {feature: [], heritage: [], ability: [], grant: []},
			sheet: {
				parts: ["header","tabs","description","benefits","feats","effects"],
				tabs: ["description","benefits","feats","effects"],
				tabGroups: 'description',
			}
		}
	}

	get _typeOptions () {
		return this.#typeOptions();
	}

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true}),
			}),
			identifier: new fields.StringField({
				required: true,
				initial: '',
				label: "SKYFALL2.Identifier",
			}),
			origin: new fields.ArrayField(
				new fields.StringField({
					required: true,
					initial: '',
				}), {
					label: "SKYFALL2.Origin",
			}),
			aquisition: new fields.ArrayField(
				new fields.StringField({
					required: true,
					initial: '',
				}), {
					label: "SKYFALL2.Origin",
			}),
			features: new fields.SetField(new fields.SchemaField({
				uuid: new fields.StringField({required: true}, {validate: Identity.validateUuid}),
				level: new fields.NumberField({
					required: true,
					integer: true,
					nullable: true,
					initial: null,
					label: 'SKYFALL2.Level',
				}),
			})),
			abilities: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
			featGroup: new fields.StringField({
				required: true,
				initial: '',
				label: "SKYFALL2.FeatGroup",
			}),
			feats: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
			benefits: new fields.ArrayField(
				this._schemaBenefits({level:1}),
			),
			favorite: new fields.BooleanField({initial: false}),
			grantDebug2: new fields.ArrayField(
				this._schemaBenefits({level:1}),
			),
		}
	}
	
	static migrateData(source){
		if ( 'origin' in source && source.origin instanceof String ) {
			source.origin = [source.origin];
		}
	}


	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */
	
	static _schemaBenefits(options = {level: null}){
		const fields = foundry.data.fields;
		return new fields.SchemaField({
			_id: new fields.StringField({
				initial: () => foundry.utils.randomID()
			}),
			type: new fields.StringField({
				required: true,
				blank: false,
				choices: {
					feature: 'TYPES.Item.feature',
					heritage: 'TYPES.Item.heritage',
					ability: 'TYPES.Item.ability',
					grant: 'SKYFALL2.Grant',
				},
				initial: 'feature',
				label: 'SKYFALL2.Type',
			}),
			uuid: new fields.StringField(
				{required: true},
				{validate: Identity.validateUuid}
			),
			granting: new fields.StringField({
				required: true,
				blank: false,
				choices: {
					feat: 'TYPES.Item.feat',
					spell: 'TYPES.Item.spell',
					path: 'TYPES.Item.path',
					abilityScore: 'SKYFALL2.Ability',
				},
				initial: 'feat',
				label: 'SKYFALL2.Granting',
			}),
			query: new fields.StringField({
				required: true,
				blank: true,
				initial: '',
				label: 'SKYFALL2.Search',
			}),
			level: new fields.NumberField({
				required: true,
				integer: true,
				nullable: true,
				initial: options.level,
				label: 'SKYFALL2.Level',
			}),
		})
	}
	
	
	/* -------------------------------------------- */
	/*  Getters & Setters                           */
	/* -------------------------------------------- */
	
	get _benefits () {
		const data = this.toObject(true);
		let benefits = this._typeOptions.benefitTypes;
		const content = data.benefits;
		content.reduce((acc, v, i) => {
			v._index = i;
			v.item = fromUuidSync(v.uuid);
			acc[v.type] ??= [];
			acc[v.type].push(v);
			return acc;
		}, benefits);
		// let benefitTypes = this._typeOptions.benefitTypes;
		// benefits = foundry.utils.mergeObject(benefitTypes, content);
		return benefits;
	}

	get _benefits2 () {
		let benefits = {};
		const content = this.benefits.reduce((acc, v, i) => {
			v._index = i;
			v.item = fromUuidSync(v.uuid);
			if ( ['class','path'].includes(this.parent.type) ){
				acc[v.level] ??= {feature: [], grant: []};
				acc[v.level][v.type] ??= [];
				acc[v.level][v.type].push(v);
			} else {
				acc[v.type] ??= [];
				acc[v.type].push(v);
			}
			return acc;
		}, {});
		let benefitTypes = this._typeOptions.benefitTypes; // {};
		if ( ['class','path'].includes(this.parent.type) ){
			const maxLevel = this.parent.type == 'class' ? 12 : 2;
			for (let level = 1; level <= maxLevel; level++) {
				// const benefitTypes = {feature: [], grant: []};
				benefits[level] = foundry.utils.mergeObject(benefitTypes, content[level]);
			}
			return benefits;
		} else if (['legacy'].includes(this.parent.type)) {
			// benefitTypes = {feature: [], heritage: [], grant: []};
		} else if (['heritage','curse','background'].includes(this.parent.type)) {
			// benefitTypes = {feature: [], grant: []};
		} else if (['feature','feat'].includes(this.parent.type)) {
			// benefitTypes = {ability: [], grant: []};
		}
		benefits = foundry.utils.mergeObject(benefitTypes, content);
		return benefits;
	}

	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */
	
	async _preCreate(data, options, user) {
		if ( user.id != game.user.id) return false;
		console.warn('Identity._preCreate');
		let allowed = true;
		if ( allowed ) allowed = await this._allowCreation();
		if ( allowed ) allowed = await this.parent.system.identityOrigin();
		return allowed;
	}

	async _allowCreation(){
		if ( !this.parent.isEmbedded ) return true;
		const {type, unique, parentTypes, benefitTypes} = this._typeOptions;
		const actor = this.parent.parent;
		const identifier = this.identifier;
		const existingItems = actor.items.filter( i => i.type == type );
		const existingIdentifier = existingItems.find( i => i.system.identifier == identifier );
		const { DialogV2 } = foundry.applications.api;
		// Allow creation on Actor
		if ( parentTypes.length && !parentTypes.includes(actor.type) ){
			ui.notifications.warn(
				game.i18n.localize("SKYFALL2.NOTIFICATION.InvalidParentType")
			);
			return false;
		}
		let allowed = true;
		if ( unique && existingItems.length ) {
			// UI: DUPLICATE ALERT / REPLACE PROMPT
			allowed = await DialogV2.confirm({
				content: game.i18n.format("SKYFALL2.DIALOG.OverwriteExistingItem", {
					actor: actor.name,
					type: game.i18n.localize(`TYPES.Item.${type}`),
				})
			});
			if ( allowed ) {
				const existing = existingItems.find(Boolean);
				await actor.deleteEmbeddedDocuments("Item", [existing.id]);
			}
			return allowed;
		}
		if ( identifier && existingIdentifier ) {
			if ( type == 'class' ) {
				const nextLevel = existingIdentifier.system.level + 1;
				existingIdentifier.system.levelUp(nextLevel);
				return false;
			} else if ( type == 'path' ) {
				const pathOrigin = existingIdentifier.system.origin;
				pathOrigin.push('path-02');
				existingIdentifier.update({'system.origin': pathOrigin});
				return false;
			} else {
				// UI: DUPLICATE ALERT / REPLACE PROMPT
				allowed = await DialogV2.confirm({
					content: game.i18n.format("SKYFALL2.DIALOG.OverwriteExistingItem", {
						actor: actor.name,
						type: game.i18n.localize(`TYPES.Item.${type}`),
					})
				});
				if ( allowed ) {
					await actor.deleteEmbeddedDocuments("Item", [existingIdentifier.id]);
				}
				return allowed;
			}
		}
		return true;
	}

	async identityOrigin() {
		if ( !this.parent.isEmbedded ) return true;
		return true;
	}
	

	_onCreate(data, options, userId) {
		if ( userId != game.user.id) return false;
		
		this._promptBenefitsDialog();
	}
	
	_promptBenefitsDialog(){
		if ( !this.parent.isEmbedded ) return;
		const benefits = this.benefits.filter(i=> {
			return (this.level ? i.level == this.level : true);
		});
		if ( !benefits.length ) return;
		console.warn("Identity._promptBenefitsDialog");
		const { BenefitsDialog } = skyfall.applications
		BenefitsDialog.prompt({item: this.parent, level: this.level});

	}
	// async _preUpdate(changes, options, user) {}
	// _onUpdate(changed, options, userId) {}

	/* -------------------------------------------- */
	/*  Type Methods                                */
	/* -------------------------------------------- */
	/**
	 * Validate that each entry in the talents Set is a UUID.
	 * @param {string} uuid     The candidate value
	 */
	static validateUuid(uuid) {
		const {documentType, documentId} = foundry.utils.parseUuid(uuid);
		if ( CONST.DOCUMENT_TYPES.includes(documentType) || !foundry.data.validators.isValidId(documentId) ) {
			throw new Error(`"${uuid}" is not a valid UUID string`);
		}
	}

}