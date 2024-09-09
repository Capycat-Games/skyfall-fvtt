import Partner from "./partner.mjs";

/**
 * Data schema, attributes, and methods specific to Creation type Actors.
 */
export default class Creation extends Partner {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;

		return Object.assign( super.defineSchema(), {
			abilities: new _fields.MappingField( this.schemaAbility() , {
				initialKeys: SYSTEM.abilities,
				initialKeysOnly: true, label: "SKYFALL2.AbilityPl"
			}),
			creator: new fields.SchemaField({
				uuid: new fields.DocumentUUIDField({type: "Actor", label:"TYPES.Actor.character"}),
			}),
		});
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		this.abilities = {}
	}

	/** @inheritDoc */
	prepareDerivedData() {
		if( this.creator.uuid ) {
			const document = fromUuidSync(this.creator.uuid);
			if ( !document ) return;
			this.creator.name = document.name;
			this.abilities = document.system.abilities;
			this.proficiency = document.system.proficiency;
		} else return;
	}

	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

	async _preCreate(data, options, user) {
		// PROMPT CREATOR
	}

	
	/* -------------------------------------------- */
	/* System Methods                               */
	/* -------------------------------------------- */
	
	// async _applyDamage() {}
	async _applyConsuption() {}
	async _rollInitiative() {}

}