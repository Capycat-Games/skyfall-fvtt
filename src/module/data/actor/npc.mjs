import Creature from "./creature.mjs";
/**
 * Data schema, attributes, and methods specific to NPC type Actors.
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
			hierarchy: new fields.StringField({
				required: true,
				choices: SYSTEM.hierarchy,
				initial: 'complex',
				blank: true,
				label: "SKYFALL.DM.HIERARCHY"
			}),
			archetype: new fields.SetField(new fields.StringField({
				required:true,
				choices: SYSTEM.archetype,
				initial:'brute'
			}), {label:"SKYFALL.DM.ARCHETYPE"}),
		});
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */


	/* -------------------------------------------- */
	/*  Getters & Setter                            */
	/* -------------------------------------------- */

	get directoryData() {
		const dirData = {
			level: game.i18n.localize('SKYFALL2.CR') + ' ' + this.level.value,
			hierarchy: this.parent.items.find(i => i.type == 'hierarchy'),
			archetype: this.parent.items.filter(i => i.type == 'archetype'),
			type: game.i18n.localize(`SKYFALL2.CREATURE.${this.creatureType.titleCase()}`),
		}
		const hierarchy = dirData.hierarchy?.name ?? "—";
		const archetype = dirData.archetype.map(i => i.name).join(', ') ?? "—";
		
		//game.i18n.localize(`SKYFALL2.HIERARCHY.${this.hierarchy.titleCase()}`)
		//this.archetype.toObject().map(i => game.i18n.localize(`SKYFALL2.ARCHETYPE.${i.titleCase()}`)).join(', ');
		
		const type = game.i18n.localize(`SKYFALL2.CREATURE.${this.creatureType.titleCase()}`);
		return `${dirData.level}, ${hierarchy} (${archetype}), ${dirData.type}`;
	}

	get isBoss() {
		const actor = this.parent;
		const hierarchy = actor.items.find( i => i.type == 'hierarchy' );
		if ( !hierarchy ) return false;
		return (hierarchy.system.identifier == 'boss');
	}

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
		for (const [key, abl] of Object.entries(data.abilities)) {
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
	/* Type Methods                                 */
	/* -------------------------------------------- */
	
	async _progression(){
		const context = {};
		const actor = this.parent.toObject(true);
		const items = actor.items;
		context.hierarchy = items.find( i => i.type == 'hierarchy' );
		context.archetype = items.filter( i => i.type == 'archetype' );
		context.abilities = {};
		items.map( i => {
			if ( i.type == 'hierarchy' ) {
				context.hierarchy = i;
			} else if ( i.type == 'archetype' ) {
				context.archetype ??= [];
				context.archetype.push(i);
			} else if ( i.type == 'ability' ) {
				const execution = i.system.activation.type ?? 'free';
				context.abilities[execution] ??= [];
				context.abilities[execution].push(i);
			} else if ( i.type == 'spell' ) {
				context.spells ??= [];
				context.spells.push(i);
			} else {
				
			}
			return true;
		})
		return context;
	}
	// async _applyDamage() {}
	async _applyConsuption() {}
	async _rollInitiative() {}

}
