
/**
 * A simple form to set actor movement speeds
 * @extends {DocumentSheet}
 */
export default class ActorItemCreate extends FormApplication { // DEPRECATE
	constructor(actor, item, options) {
		super(actor, options);
		this.actor = actor;
		this.item = item;
		this.cretionList = [];
		this.updateList = [];
	}

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["skyfall"],
			width: 400,
			height: "auto"
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get title() {
		return "ITEMCREATE";
		//game.i18n.format('SKYFALL.ACTOR.PROGRESSIONPROMPT', this.document.name);
	}

	/* -------------------------------------------- */

	get template() {
		return `systems/skyfall/templates/apps/actor-item-create.hbs`;
	}

	/* -------------------------------------------- */

	get source() {
		return foundry.utils.deepClone(this.document._source);
	}
	/* -------------------------------------------- */

	/** @override */
	async getData(options) {
		const context = {
			item: this.item,
			actor: this.actor,
			steps: [],
			SYSTEM
		}
		
		if ( this.item.system.features ) {
			let step = {
				id: "features",
				label: "features",
				itemList: await this.getItemList(this.item.system.features)
				// prepare {id, name, icon, option(add,update,ignore)}
			}
			context.steps.push(step);
		}
		
		if ( this.item.system.abilities ) {
			let step = {
				id: "abilities",
				label: "abilities",
				itemList: await this.getItemList(this.item.system.abilities)
				// prepare {id, name, icon, option(add,update,ignore)}
			}
			context.steps.push(step);
		}
		
		return context;
	}

	

	/**
	 * @param {*} sourceList    Array of Uuids
	 * @returns                 List of embeded objects with details
	 */
	async getItemList( sourceList){
		let list = [];
		for (const uuid of sourceList) {
			const item = await fromUuid(uuid);
			if ( !item ) continue;
			list.push({
				id: uuid, name: item.name, img: item.img
			});
		}
		return list;
	}

	async getUpdateListStep( id, label, sourceList, options = {} ){
		return;
	}

	/** @inheritdoc */
	async _updateObject(event, formData) {
		const createItems = [];
		if ( !formData['item_create'] ) formData['item_create'] = [];
		for (const uuid of formData['item_create']) {
			const item = await fromUuid(uuid);
			if ( !item ) continue;
			createItems.push(item.toObject());
		}
		
		if ( createItems ) this.actor.createEmbeddedDocuments("Item", createItems);
		return;
	}
}