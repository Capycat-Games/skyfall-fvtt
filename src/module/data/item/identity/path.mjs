import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Path type Items.
 */
export default class Path extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'path',
			unique: false,
			parentTypes: ['character'],
			benefitTypes: {feature: [], grant: []},
		}
	}

	get _typeOptions () {
		return this.#typeOptions();
	}

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			type: new fields.StringField({required: true, choices:SYSTEM.pathTypes, initial: "specialized",label: "SKYFALL2.Type"}),
			featuresAdv: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
		});
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */
	/*  Getter & Setters                            */
	/* -------------------------------------------- */
	
	get _benefits () {
		const data = this.toObject(true);
		let benefits = {};
		for (let level = 1; level <= 2; level++) {
			benefits[level] = this._typeOptions.benefitTypes;
		}
		const content = data.benefits;
		content.reduce((acc, v, i) => {
			v._index = i;
			v.item = fromUuidSync(v.uuid);
			acc[v.level][v.type] ??= [];
			acc[v.level][v.type].push(v);
			return acc;
		}, benefits);
		
		return benefits;
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */
	
	/** @override */
	prepareDerivedData() {
		if ( this.parent.isEmbedded ) {
			const actor = this.parent.parent;
			// const paths = actor.items.filter( i => i.type == 'path' && i.system.identifier == this.identifier );
			let level = this.origin.filter( i => i.startsWith('path-')).length;
			this.level = level;
		}
	}

	
	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

	async identityOrigin() {
		if ( !this.parent.isEmbedded ) return true;
		const {type, unique, parentTypes, benefitTypes} = this._typeOptions;
		const actor = this.parent.parent;
		const identifier = this.identifier;
		const existingItems = actor.items.filter( i => i.type == type );
		const existingIdentifier = existingItems.find( i => i.system.identifier == identifier );

		if ( type == 'path' && existingIdentifier ) {
			const pathOrigin = existingIdentifier.system.origin;
			pathOrigin.push('path-02');
			existingIdentifier.update({'system.origin': pathOrigin});
			return false;
		}
		if ( type == 'path' && existingItems ) {
			this.parent.updateSource({'system.origin': ['path-01']});
			return true;
		}
		return true;
	}

}
