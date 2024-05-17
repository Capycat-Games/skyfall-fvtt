import SkyfallActor from "../documents/actor.mjs";

export default class ItemUsageConfig extends DocumentSheet {
	// constructor(message, options) {
	// 	super(message, options);
		
	// 	this.actor = options.actor;
	// 	this.ability = options.ability;
	// 	this.item = options.item;
	// }
	

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["skyfall", "item-usage-config"],
			template: `systems/${SYSTEM.id}/templates/apps/usage-config.hbs`,
			width: 600,
			height: "auto", //400,
			submitOnChange: true,
			closeOnSubmit: false,
		});
	}

	/* -------------------------------------------- */
	/*  Context Preparation                         */
	/* -------------------------------------------- */


	/* -------------------------------------------- */

	/** @override */
	async getData(options) {
		const context = {};
		context.SYSTEM = SYSTEM;
		context.system = this.document.system;
		
		this.getUsageEffects(context);
		// console.log( this );
		// console.log( context.system.abilityState.system );
		// console.log( context.system.itemState.system );
		// console.log( context.system.item );
		// console.log(context);
		console.log(context);
		return context;
	}

	/* -------------------------------------------- */

	async getUsageEffects(context){
		context.modifications = [];
		const actorId = context.system.actorState._id;
		const actor = new SkyfallActor( context.system.actorState );
		if ( !actor ) return;
		const mods = actor.allModifications;
		//await foundry.utils.fromUuid(actorId);
		for (const mod of actor.allModifications) {
			const {itemName, itemType, descriptors} = mod.system.apply;
			console.log(itemType, context.system.item.type);
			if ( itemName && !itemName.split(',').map(n=>n.trim()).includes(context.system.item.name) ) continue;
			console.log("NAME OK");
			if ( itemType.includes('self') && mod.parent.id != context.system.abilityId ) continue;
			console.log("SELF OK");
			if ( !foundry.utils.isEmpty(itemType) && !itemType.includes('self') && !itemType.includes(context.system.item.type) ) continue;
			console.log("TYPE OK");
			if ( !foundry.utils.isEmpty(descriptors) && !descriptors.every( d => context.system.item.system.descriptors.includes(d) ) ) continue;
			console.log("DESCRIPTOR OK");
			context.modifications.push(mod);
		}
	}

	
	/** @inheritDoc */
	activateListeners(html) {
		super.activateListeners(html);
		html.on("click", "[data-action]", this.#onClickControl.bind(this));
	}

	/**
	 * Handle clicks on action button elements.
	 * @param {PointerEvent} event        The initiating click event
	 * @returns {Promise<void>}
	 */
	async #onClickControl(event) {
		event.preventDefault();
		const button = event.currentTarget;
		button.event = event.type; //Pass the trigger mouse click event
		switch ( button.dataset.action ) {
			case "execute":
				this.document.usageExecutePhase();
				break;
			case "aid":

				break;
		}
	}

	
	
	get isEditable() {
		return game.user.isGM || this.document.author == game.user;
	}
	
	/** @inheritDoc */
	_canUserView(user) {
		return user.isGM || this.document.author == user;
	}

	/** @inheritdoc */
	async _updateObject(event, formData) {
		formData = foundry.utils.expandObject(formData);
		if ( formData.system.modifications ) {
			let _mods = {};
			for (const [id, mod] of Object.entries(formData.system.modifications)) {
				if ( mod.apply == 0 || mod.apply == null ) {
					_mods[`-=${id}`] = null;
				} else {
					_mods[id] = mod;
				}
			}
			formData.system.modifications = _mods;
		}
		formData = foundry.utils.flattenObject(formData);
		return super._updateObject(event, formData);
	}

}
