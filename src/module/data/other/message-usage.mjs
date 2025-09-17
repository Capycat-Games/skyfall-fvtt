const {renderTemplate} = foundry.applications.handlebars;

import D20Roll from "../../dice/d20-roll.mjs";
import SkyfallRoll from "../../dice/skyfall-roll.mjs";
import BaseChatMessage from "./message-base.mjs";
/**
 * Data schema, attributes, and methods specific to Usage type ChatMessages.
 */
export default class UsageChatMessage extends BaseChatMessage {

	static get metadata () {
		return {
			cssClasses: 'usage-v2'
		}
	}

	_actor;
	_item;
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return Object.assign(super.defineSchema(), {
			actor: new fields.StringField(),
			item: new fields.StringField(),
			modifications: new fields.ObjectField(),
			rolls: new fields.ArrayField( new fields.ObjectField() ),
			targets: new fields.ArrayField( new fields.StringField() ),
			measuredTemplate: new fields.ArrayField( new fields.ObjectField() ),
			effects: new fields.ArrayField( new fields.ObjectField() ),
			costs: new fields.ObjectField(),
		});
	}
	static oldPart() {
		return Object.assign(super.defineSchema(), {
			// Uuid of actor using
			actorId: new fields.StringField({required: true}, {
				validate: UsageChatMessage.validateUuid
			}),
			// Uuid of ability being used
			abilityId: new fields.StringField({required: true}, {
				validate: UsageChatMessage.validateUuid
			}),
			// Uuid of item being used
			itemId: new fields.StringField({required: true}, {
				validate: UsageChatMessage.validateUuid
			}),
			// Object data for result Item (after withItem and modification is applied)
			item: new fields.ObjectField(),

			// Object data for Modifications
			modifications: new fields.ObjectField({required:true}),
			// Object data for Rolls (Unresolved)
			rolls: new fields.ArrayField( new fields.ObjectField() ),
			
			
			// Uuid of targets of possible effects
			targets: new fields.ArrayField( new fields.StringField() ),
			// Object data for Measured Templates ( post commit data? )
			measuredTemplate: new fields.ArrayField( new fields.ObjectField() ),
			// Object data for Active Effects
			effects: new fields.ArrayField( new fields.ObjectField() ),
			costs: new fields.SchemaField({
				hp: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				ep: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				catharsis: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				shadow: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				uses: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
				quantity: new fields.ArrayField(new fields.SchemaField({
					id: new fields.StringField({
						require: true,
						blank: true,
					}),
					path: new fields.StringField({
						require: true,
						blank: true,
					}),
					value: new fields.NumberField({
						require: true,
						initial: 0
					}),
				})),
				// new fields.NumberField({
				// 	nullable: true, blank: true, integer: true, initial:0, min: 0
				// }),
				charges: new fields.NumberField({
					nullable: true, blank: true, integer: true, initial:0, min: 0
				}),
			}),
		});
	}

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

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	
	prepareBaseData() {
		super.prepareBaseData();
		// return;
		//if ( this.actor && !foundry.utils.isSubclass(this.actor, Actor) ) {
		if ( this.actor == "[object Object]" ){
		} else if ( this.actor && foundry.utils.getType(this.actor) == 'string' ) {
			this._actor = Actor.fromJSON(this.actor);
		}
		//if ( this.item?.weapon && !foundry.utils.isSubclass(this.item.weapon, Item) ) {
		if ( this.item == "[object Object]" ){	
		} else if ( this.item && foundry.utils.getType(this.item) == 'string' ) {
			this._item = Item.fromJSON(this.item);
			if ( this.weapon ) this._item.weapon = this.weapon;
		}
		
		for (const [i, roll] of this.rolls.entries()) {
			// if ( roll.original && !foundry.utils.isSubclass(roll.original, Roll) ) {
			if ( roll && foundry.utils.getType(roll) == 'string' ) {
				this.rolls[i] = Roll.fromData(roll);
			}
			// if ( roll.evaluated && !foundry.utils.isSubclass(roll.evaluated, Roll) ) {
			// 	this.rolls[i].evaluated = Roll.fromData(roll.evaluated);
			// }
		}
		for (const [i, effect] of this.effects.entries()) {
			//if ( !foundry.utils.isSubclass(effect, ActiveEffect) ) {
			if ( effect && foundry.utils.getType(effect) == 'string' ) {
				this.effects[i] = ActiveEffect.fromData(effect);
			}
		}
	}
	
	async getDocuments2() {
		return;
		const {actorId, abilityId, itemId} = this;
		const {UsageItem} = skyfall.models.other;
		if ( !this.actor || actorId != this.actor?.id ) {
			const actor = await fromUuid(actorId);
			if ( !actor ) return;
			this.actor = actor.clone({}, {keepId: true});
			this.item = this.actor?.items.get(abilityId);
			this.weapon = this.actor?.items.get(itemId);
			this.something = UsageItem.fromItem(this.item, this.weapon);
			// this.something.actor = this.actor;
		}
	}
	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */


	async prepareContentData(){
		await this.getDocuments();
		switch (this.item.type) {
			case 'ability':
			case 'spell':
			case 'sigil':
			case 'guild-ability':
				return this.abilityContentData();
				break;
			default:
				break;
		}
	}

	async abilityRoll(options) {
		if ( options.type == 'damage') {
			
		}
	}

	async abilityContentData(){
		const advantage = this.parent.getFlag('skyfall', 'advantage') ?? 0;
		const disadvantage = this.parent.getFlag('skyfall', 'disadvantage') ?? 0;
		const weapon = this.weapon;
		const context = {};
		context.actor = this.actor;
		context.item = this.item;
		context.rolls = {
			listed: [],
			evaluated: [],
		}
		const RollData = foundry.utils.mergeObject(
			this.actor.getRollData(), this.item.getRollData()
		);
		if ( weapon ) {
			RollData['item'] = weapon.getRollData();
			context.item.img = weapon.img;
			context.item.weapon = weapon.name;
			// MERGE DESCRIPTORS
			context.item.system.descriptors = [
				...context.item.system.descriptors,
				...weapon.system.descriptors,
			];
		}
		let damageType = context.item.system.descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const AbilityAttack = context.item.system.attack;
		// Attack Roll
		if ( AbilityAttack.ability ) {
			const attack = this.item.system.getAttack({
				advantage, disadvantage, RollData, weapon,
			});
			const roll = D20Roll.fromSkyfallTerms(attack.terms, RollData, attack.options);
			context.rolls.listed.push( roll );
		}
		// Damage Roll
		const damageData = {
			RollData, weapon, damageType, versatile: false,
		}
		if ( AbilityAttack.damage ) {
			const damage = this.item.system.getDamage(damageData);
			const roll = SkyfallRoll.fromSkyfallTerms(damage.terms, RollData, damage.options);
			context.rolls.listed.push( roll );
		}

		// Versatile Damage Roll
		if ( AbilityAttack.damage && context.item.system.descriptors.includes('versatile') ) {
			damageData.versatile = true;
			const damage = this.item.system.getDamage(damageData);
			const roll = SkyfallRoll.fromSkyfallTerms(damage.terms, RollData, damage.options);
			context.rolls.listed.push( roll );
		}
		
		// Modifications
		context.modifications =  this.actor.getItemModifications({
			item: this.item,
			weapon: this.weapon,
		}).filter( ef => ef.apply > 0);
		
		// Templates
		context.measuredTemplate = this.item.system.getMeasuredTemplate();
		// Effects
		context.effects = this.item.system.getEffects();
		
		return context;
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	async _preCreate(data, options, user) {
		// for (const roll of data.system.rolls ) {
		// 	roll.template = await roll.render();
		// }
		// const template = "systems/skyfall/templates/v2/chat/usage.hbs";
		// // const content = await renderTemplate( template, data.system );
		// const content = await renderTemplate( template, {
		// 	...data.system,
		// 	actor: JSON.parse(data.system.actor),
		// 	item: JSON.parse(data.system.item),
		// });
		// data.content = content;
		// data.system.actor = JSON.stringify(data.system.actor);
		// this._actor = JSON.parse(data.system.actor);
		// data.system.item = JSON.stringify(data.system.item);
		// this._item = JSON.parse(data.system.item);
		// data.system.rolls = data.system.rolls.map( i => i.toJSON());
		// data.system.effects = data.system.effects.map( i => i.toJSON());
		// this.updateSource({
		// 	"system.actor": data.system.actor,
		// 	"system.item": data.system.item,
		// 	"system.rolls": data.system.rolls,
		// 	"system.effects": data.system.effects,
		// });
		await super._preCreate(data, options, user);
	}
	
	/** @inheritDoc */
	_onCreate(data, options, userId) {
		return super._onCreate(data, options, userId);
	}

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		return await super._preUpdate(changed, options, user);
	}
	
	/** @inheritDoc */
	_onUpdate(changed, options, userId) {
		return super._onUpdate(changed, options, userId);
	}
}