import Creature from "./creature.mjs";
/**
 * Data schema, attributes, and methods specific to Ancestry type Items.
 */

export default class NPC extends Creature {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return Object.assign( super.defineSchema(), {
			resources: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL2.Current"}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL2.Total"}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.Temporary"}),
				}),
				shadow: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 5, min: 0, max: 5, label: "SKYFALL2.RESOURCE.Shadow"}),
				}),
			}),
			hierarchy: new fields.StringField({required:true, choices: SYSTEM.hierarchy, initial:'complex', blank:true, label:"SKYFALL.DM.HIERARCHY"}),
			archetype: new fields.SetField(new fields.StringField({required:true, choices: SYSTEM.archetype, initial:'brute'}),{label:"SKYFALL.DM.ARCHETYPE"}),
		});
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @override */
	prepareBaseData() {
		const level = this.level.value;
		this.proficiency = (level >= 17 ? 6
				: (level >= 13 ? 5
				: (level >= 9 ? 4
				: (level >= 5 ? 3
				: 2 ))));
		super.prepareBaseData();
	}

	prepareDerivedData() {
		super.prepareDerivedData();

		this.prepareHitPoints();
		
	}
	
	prepareHitPoints(){
		const { hp } = this.resources;
		this.resources.hp.pct = Math.round( hp.value * 100 / hp.max );
		this.resources.hp.tpct = Math.round( hp.temp * 100 / hp.max );
		this.resources.hp.negative = hp.value < 0 ;
	}

	getRollData() {
		const data = super.getRollData();
		for (const [key, abl] of Object.entries(SYSTEM.abilities)) {
			data[key] = abl.value;
			if ( abl.spellcasting ) {
				data.magic = Math.max(data.magic, abl.value);
			}
		}
		return data;
	}

	
  /* -------------------------------------------- */
  /*  Database Operations                         */
  /* -------------------------------------------- */

	
	/* -------------------------------------------- */
	/* System Methods                               */
	/* -------------------------------------------- */
	
	// async _applyDamage() {}
	async _applyConsuption() {}
	async _rollInitiative() {}

}
