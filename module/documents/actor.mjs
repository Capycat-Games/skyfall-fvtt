import RollConfig from "../apps/roll-config.mjs";
import { SYSTEM } from "../config/system.mjs";
import { actor } from "../data/_module.mjs";
import D20Roll from "../dice/d20-roll.mjs";
import SkyfallRoll from "../dice/skyfall-roll.mjs";

/**
 * Extend the base Actor document
 * @extends {Actor}
 */
export default class SkyfallActor extends Actor {

	
	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	get allModifications(){
		const mods = [];
		mods.push( ...this.effects.filter(ef => ef.type == 'modification') );
		this.items.reduce( (acc, item) => {
			const efs = item.effects.filter(ef => ef.type == 'modification');
			acc.push(...efs);
			return acc;
		}, mods);
		return mods;
		//this.effects.filter( ef => ef.type == 'modification');
	}

	get classes() {
		return this.items.filter(it => it.type == 'class');
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	applyActiveEffects(){
		super.applyActiveEffects();
	}
	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const data = { ...this.system.getRollData() }
		return data;
	}

	
	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// SET DEFAULT TOKEN
		const prototypeToken = {};
		if ( this.system.size ) {
			const size = SYSTEM.actorSizes[this.system.size].gridScale ?? 1;
			if ( !foundry.utils.hasProperty(data, "prototypeToken.width") ) prototypeToken.width = size;
			if ( !foundry.utils.hasProperty(data, "prototypeToken.height") ) prototypeToken.height = size;
		}
		if ( this.type === "character" ) {
			prototypeToken.sight = { enabled: true };
			prototypeToken.actorLink = true;
			prototypeToken.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
		}
		this.updateSource({ prototypeToken });
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		await super._onCreate(data, options, user);
		
	}
	
	/* -------------------------------------------- */

	/** @inheritdoc */
	async _preUpdate(data, options, userId) {
		// SET DEFAULT TOKEN
		const prototypeToken = {};
		if ( data.system?.size ) {
			const size = SYSTEM.actorSizes[data.system.size].gridScale ?? 1;
			data.prototypeToken = {
				width: size,
				height: size
			}
		}
		return await super._preUpdate(data, options, userId);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	_onUpdate(changed, options, userId) {
		super._onUpdate(changed, options, userId);
		this.refreshGuild(userId);
	}

	async refreshGuild( userId ){
		if ( game.user.id != userId ) return;
		if ( this.type != 'character' ) return;
		const guild = game.actors.find( g => g.type == 'guild' && g.system.members.find( m => m.uuid == this.uuid ) );
		if ( guild ) { 
			guild.prepareData();
			guild.sheet.render();
		}
	}
	
	/* -------------------------------------------- */

	/** @inheritdoc */
	async _preCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
		super._preCreateDescendantDocuments(parent, collection, documents, data, options, userId);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
		super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
	}

	/* -------------------------------------------- */
	
	/** @inheritDoc */
	async _onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId) {
		super._onUpdateDescendantDocuments( parent, collection, documents, changes, options, userId );
		this.refreshGuild(userId);
		this.system._automateStatuses(userId);
	}
	/* -------------------------------------------- */

	#promptIndiviualItem(item){
		if( item.system.features ) {
			// LIST RECEIVED FEATURES
			// ADD TO CREATELIST
		}

		if( item.system.heritages ) {
			// PROMPT HERITAGE CHOICE
			// ADD TO CREATELIST
		}

		if( item.system.feats ) {
			// PROMPT FEAT CHOICE
			// ADD TO CREATELIST
		}
	}
	
	/** @inheritdoc */
	*allApplicableEffects(type = 'base') {
		for ( const effect of this.effects.filter( ef => ef.type == type ) ) {
			yield effect;
		}
		if ( CONFIG.ActiveEffect.legacyTransferral ) return;
		for ( const item of this.items ) {
			for ( const effect of item.effects.filter( ef => ef.type == type ) ) {
				if ( effect.transfer ) yield effect;
			}
		}
	}

	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */

	async modifyTokenAttribute(attribute, value, isDelta=false, isBar=true) {
		const attr = foundry.utils.getProperty(this.system, attribute);
		const current = isBar ? attr.value : attr;
		const update = isDelta ? current + value : value;
		if ( update === current ) return this;

		// Determine the updates to make to the actor data
		let updates;
		if ( isBar ) updates = {[`system.${attribute}.value`]: Math.clamp(update, (attr.max * -1), attr.max)};
		else updates = {[`system.${attribute}`]: update};

		// Allow a hook to override these changes
		const allowed = Hooks.call("modifyTokenAttribute", {attribute, value, isDelta, isBar}, updates);
		return allowed !== false ? this.update(updates) : this;
	}
	
	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */
	
	/**
	* Apply a certain amount of damage or healing to the health pool for Actor
	* @param {number} amount			 An amount of damage (positive) or healing (negative) to sustain
	* @param {number} multiplier	 A multiplier which allows for resistance, vulnerability, or healing
	* @return {Promise<Actor>}		 A Promise which resolves once the damage has been applied
	*/
	async applyDamage(roll, multiplier = 1, applyDR = false) {
		this.system._applyDamage( roll, multiplier, applyDR );
		return;
		
	}

	async rollCheck({type='ability', id='str', abl='str'}, options){
		const roll = await new RollConfig({
			type: type,
			ability: abl,
			skill: id,
			actor: this,
			createMessage: true,
			skipConfig: options.skipConfig ?? false,
			advantageConfig: options.advantageConfig ?? 0,
		}).render( !(options.skipConfig ?? false) );
		
		if ( type='initiative' && roll ) {
			try {
				const combat = game.combats.active;
				if (!combat) return;
				const combatant = combat.combatants.filter(
					(c) => c.actor.id === this.id
				);
				if ( !combatant || combatant.initiative != null ) return;
				combat.setInitiative(combatant.id, roll.total);
				console.log(`Foundry VTT | Iniciativa Atualizada para ${combatant._id} (${combatant.actor.name})`);
			} catch (error) {
				console.warn(`Foundry VTT | Erro ao adicionar a Iniciativa, ${combatant._id} (${combatant.actor.name})`);
			}
		}
	}

	/** @inheritdoc */
	async rollInitiative({createCombatants=false, rerollInitiative=false, initiativeOptions={}}={}) {
		const roll = await new RollConfig({
			type: 'initiative',
			ability: 'dex',
			// skill: null,
			actor: this,
			createMessage: true,
			createCombatants: createCombatants,
			skipConfig: initiativeOptions.skipConfig ?? false,
			advantageConfig: initiativeOptions.advantageConfig ?? 0,
		}).render( !(initiativeOptions.skipConfig ?? false) );
	}

	async shortRest(message){
		const updateData = message.system.restUpdate;
		// TODO UPDATE ITEMS USES
		this.update(updateData);
	}

	async longRest(){
		const systemData = this.system;
		const updateData = {};
		const select = document.createElement('select');
		select.name = 'quality';
		for (const quality of ['bad','default','good']) {
			const opt = document.createElement('option');
			opt.value = quality;
			opt.innerText = game.i18n.localize(`SKYFALL2.APP.REST.${quality.titleCase()}`);
			if ( quality == 'default' ) opt.toggleAttribute('selected');
			select.append(opt);
		}
		
		const quality = await foundry.applications.api.DialogV2.prompt({
			content: `<form><div class="form-group"><label>${game.i18n.localize("SKYFALL2.APP.REST.Quality")}</label>${select.outerHTML}</div></form>`,
			classes: ['skyfall', 'short-rest'],
			window: {
				title: game.i18n.localize("SKYFALL2.APP.LongRest"),
			},
			position: {
				width: 300,
			},
			ok: {
				label: "Submit",
				callback: (event, button, dialog) => button.form.elements.quality.value
			},
		});
		
		updateData['system.resources.hp.value'] = systemData.resources.hp.max;
		updateData['system.resources.ep.value'] = systemData.resources.ep.max;
		updateData['items'] = [];
		const classes = this.classes;
		for (const cls of classes) {
			const current = cls.system.hitDie.value;
			let hd = (quality == "bad" ? current + Math.floor(cls.system.hitDie.max/2) : cls.system.hitDie.max);
			updateData['items'].push({
				_id: cls.id,
				"system.hitDie.value": hd,
			});
		}
		// TODO UPDATE ITEMS USES
		this.update(updateData);
	}

	async toggleStatusEffect(statusId, {active, overlay=false}={}) {
		const rightClick = overlay ? true : false;
		if ( overlay ) overlay = false; // DEAD is the only overlay;
		if ( statusId === 'dead' ) overlay = true;
		let status = SYSTEM.conditions[statusId];
		if ( status?.system?.stack ) {
			const effect = this.effects.find(ef => ef.id.startsWith(statusId) );
			if ( effect && effect.stack > 1 ) {
				return effect.stack =  rightClick ? -1 : 1;
			} //else if ( !effect ) return;
		}
		return super.toggleStatusEffect(statusId, {active, overlay}) 
	}

}
