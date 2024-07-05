import SkyfallActor from "../documents/actor.mjs";

export default class ItemUsageConfig extends DocumentSheet {
	// constructor(message, options) {
	// 	super(message, options);
		
	// 	this.actor = options.actor;
	// 	this.ability = options.ability;
	// 	this.item = options.item;
	// }
	modifications = [];

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["skyfall", "item-usage-config"],
			template: `systems/${SYSTEM.id}/templates/apps/usage-config.hbs`,
			width: 600,
			height: "auto", //400,
			submitOnChange: false,
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
		this.document.getDocuments();
		context.actor = this.document.actor;
		context.ability = this.document.ability;
		context.item = this.document.item;
		context.modifications = this.document.system.modifications;

		// this.getUsageEffects(context);
		// console.log( this.document.system );
		// console.log( context.system.abilityState.system );
		// console.log( context.system.itemState.system );
		// console.log( context.system.item );
		console.log("ItemUsageConfig", context);
		return context;
	}

	/* -------------------------------------------- */

	async getUsageEffects(context){
		context.modifications = [];
		const actorId = context.system.actorState._id;
		const actor = new SkyfallActor( context.system.actorState );
		if ( !actor ) return;
		const mods = actor.allModifications;
		// console.log( this.document.system.modifications );
		//await foundry.utils.fromUuid(actorId);
		for (const mod of actor.allModifications) {
			const {itemName, itemType, descriptors} = mod.system.apply;
			// console.log(itemType, context.system.item.type);
			if ( itemName && !itemName.split(',').map(n=>n.trim()).includes(context.system.item.name) ) continue;
			// console.log("NAME OK");
			if ( itemType.includes('self') && mod.parent.id != context.system.abilityId ) continue;
			// console.log("SELF OK");
			if ( !foundry.utils.isEmpty(itemType) && !itemType.includes('self') && !itemType.includes(context.system.item.type) ) continue;
			// console.log("TYPE OK");
			if ( !foundry.utils.isEmpty(descriptors) && !descriptors.every( d => context.system.item.system.descriptors.includes(d) ) ) continue;
			// console.log("DESCRIPTOR OK");
			if ( this.document.system.modifications[mod.id] ) {
				mod.apply = Number(this.document.system.modifications[mod.id].apply);
			} else if ( mod.system.apply.always ) {
				mod.apply = 1;
			} else mod.apply = 0;
			context.modifications.push(mod);
			// modifications.push(mod);
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
			case "commit":
				this.document.updateData = null;
				await this.submit();
				await this.document.updateUsagePrepareData();
				this.document.update(this.document.updateData);
				break;
			case "execute":
				this.document.usageExecutePhase();
				break;
			case "apply-add":
				button.previousElementSibling.stepUp();
				button.previousElementSibling.dispatchEvent(new Event('change'));
				this.submit();
				break;
			case "apply-sub":
				button.nextElementSibling.stepDown();
				button.nextElementSibling.dispatchEvent(new Event('change'));
				this.submit();
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
		// formData = foundry.utils.expandObject(formData);
		// formData = foundry.utils.flattenObject(formData);
		return super._updateObject(event, formData);
	}

}
