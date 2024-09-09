
/**
 * Data schema, attributes, and methods specific to Guild type Actors.
 */
export default class Guild extends foundry.abstract.TypeDataModel {

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;

		return {
			abilities: new fields.SchemaField({
				cunning: new fields.SchemaField({
					bonus: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.Cunning"
					}),
					value: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.Cunning"
					}),
					points: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.CunningPoints"
					},),
				}),
				knowledge: new fields.SchemaField({
					bonus: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.Knowledge"
					}),
					value: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.Knowledge"
					}),
					points: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.KnowledgePoints"
					}),
				}),
				crafting: new fields.SchemaField({
					bonus: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.Crafting"
					}),
					value: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 3,
						label: "SKYFALL2.GUILD.Crafting"
					}),
					points: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.CraftingPoints"
					}),
				}),
				reputation: new fields.SchemaField({
					bonus: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.Reputation"
					}),
					value: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 3,
						label: "SKYFALL2.GUILD.Reputation"
					}),
					points: new fields.NumberField({
						required: true, nullable: false, integer: true, initial: 0,
						label: "SKYFALL2.GUILD.ReputationPoints"
					}),
				}),
			}),
			level: new fields.NumberField({required:true, initial: 1, label:"SKYFALL2.Level"}),
			actions: new fields.SchemaField({
				value: new fields.NumberField({required:true, initial: 1, label:"SKYFALL2.ActionPl"}),
			}),
			motto: new fields.HTMLField({required: true, label: "SKYFALL2.GUILD.Motto"}),
			blueprints: new fields.StringField({required: true, label: "SKYFALL2.GUILD.BlueprintsPl"}),
			members: new fields.ArrayField(new fields.SchemaField({
				uuid: new fields.DocumentUUIDField({type: "Actor", label:"SKYFALL2.GUILD.Member"}),
				founder: new fields.BooleanField({required: true, initial: false, label:"SKYFALL2.GUILD.Founder"}),
				retired: new fields.BooleanField({required: true, initial: false, label:"SKYFALL2.GUILD.Retired"}),
			}))
		}
	}
	
	static migrateData(source) {
		return super.migrateData(source);
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		this.reputation = this.level;
		this.resource = 5 + (this.level * 5);
		for (const abl of Object.keys(this.abilities)) {
			this.abilities[abl].members = 0;
			this.abilities[abl].seals = 0;
			this.abilities[abl].facilities = 0;
			this.abilities[abl].value = 0;

			this.abilities[abl].limit = 0;
			this.abilities[abl].limitBonus = 0;
			
		}
	}

	/** @inheritDoc */
	async prepareDerivedData() {
		const actor = this.parent;
		if ( !actor ) return;
		const members = [];
		const pathAbilities = {
			war: 'crafting',
			specialized: 'cunning',
			mystic: 'knowledge',
		}
		this.level = 0;
		for (const member of this.members) {
			const document = fromUuidSync(member.uuid);
			if ( !document ) continue;
			const level = document.system.classes.reduce( (acc, i) =>  acc + i.system.level, 0);
			this.level = Math.max( this.level, level );
			
			let highestClass;
			for (const cls of document.system.classes ) {
				highestClass ??= cls;
				if ( cls.system.level > highestClass.system.level ) highestClass = cls;
			}
			if ( highestClass ) {
				const clsAbility = highestClass.system.guild.ability;
				this.abilities[clsAbility].members += (level >= 9 ? 3 : (level >= 5 ? 2 : 1 ));
			}
			
			for (const path of document.system.paths ) {
				const pathAbility = pathAbilities[path.system.type];
				this.abilities[pathAbility].members += 1;
			}
		}
			
		// Guild Group Actions
		this.actions.max = (this.level >= 12 ? 4 : (this.level >= 8 ? 3 : (this.level >= 4 ? 2 : 1 ) ));
		// const paths = document.items.find( i => i.type == 'path');
		
		for (const [key, abl] of Object.entries(this.abilities)) {
			abl.value = abl.value + abl.members + abl.seals + abl.facilities + abl.bonus;
			if ( key == 'reputation' ) abl.value += this.level;
			abl.value = Math.max( abl.value, 0 );
			abl.limit = ( this.level * 5 ) + 5 + abl.limitBonus; 

			abl.short = 2 * abl.value;
			abl.long = 5 * abl.value;
			continue;
			this.abilities[abl].value = this.abilities[abl].value + this.abilities[abl].members + this.abilities[abl].facilities + this.abilities[abl].seals + this.abilities[abl].bonus;
			
		}
	}
	
	getRollData() {
		return { ...this };
	}

	
	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */


	/* -------------------------------------------- */
	/* System Methods                               */
	/* -------------------------------------------- */
	
	async startGuildArc( options ) {
		// Produce Guild Points
		const messageData = {};
		const updateData = {};
		messageData.points = {};
		messageData.phase = 'start';
		for (const [ key, abl ] of Object.entries( this.abilities )) {
			const points = {};
			points.stored = abl.points;
			points.earned = Math.min( abl[ options.arcLength ], abl.limit )
			points.total = points.stored + points.earned;
			points.label = game.i18n.localize(`SKYFALL2.GUILD.${key.titleCase()}`);
			points.icon = SYSTEM.icons.on;
			messageData.points[key] = points;
			updateData[`system.abilities.${key}.points`] = points.total;
		}
		
		// Restore Actions
		updateData[`system.actions.value`] = this.actions.max;
		messageData.actions = this.actions.max;
		
		// MESSAGE
		let template = `systems/${SYSTEM.id}/templates/v2/chat/guild-arc.hbs`;
		const content = await renderTemplate(template, messageData);
		ChatMessage.create({
			content: content
		})
		this.parent.update( updateData );
	}

	async endGuildArc() {
		const messageData = {};
		const updateData = {};
		messageData.points = {};
		messageData.phase = 'end';
		for (const [ key, abl ] of Object.entries( this.abilities )) {
			const points = {};
			points.stored = abl.points;
			points.limit = abl.limit;
			points.total = Math.min( abl.points, abl.limit );
			points.label = game.i18n.localize(`SKYFALL2.GUILD.${key.titleCase()}`);
			points.icon = SYSTEM.icons.on;
			messageData.points[key] = points;
			updateData[`system.abilities.${key}.points`] = points.total;
		}

		// MESSAGE
		let template = `systems/${SYSTEM.id}/templates/v2/chat/guild-arc.hbs`;
		const content = await renderTemplate(template, messageData);
		ChatMessage.create({
			content: content
		})
		this.parent.update( updateData );
	}

	// TODO
	async _applyConsuption() {}
	
}
