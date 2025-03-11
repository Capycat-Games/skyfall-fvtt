
const {HandlebarsApplicationMixin, ApplicationV2, DialogV2} = foundry.applications.api;

export default class BenefitsDialog extends HandlebarsApplicationMixin(DialogV2) {
	constructor(options){
		options.title ??= "SKYFALL2.Level";
		super(options);
		this.item = options.item;
		this.grant = options.grant;
		this.level = options.level ?? 0;
		this.steps = [];
		
		this.prepareBenefits();
	}

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		id: "dialog-{id}",
		classes: ["dialog", "skyfall", "sheet", "benefits"],
		tag: "dialog",
		window: {
			title: "SKYFALL2.BenefitPl",
			frame: true,
			positioned: true,
			minimizable: false
		},
		position: {
			width: 600,
			height: "auto"
		},
		buttons: [
			{
				type: "submit", action: "ok", label: "Confirm", default: true,
				callback: (event, button, dialog) => button.form.elements.choice.value
			},
		],
		actions: {
			edit: BenefitsDialog.#onEdit,
		}
	};

	/** @override */
	static PARTS = {
		form: {
			template: "systems/skyfall/templates/v2/apps/benefits-dialog.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};
		
	async loadItems(list, sync) {
		const arr = [];
		if ( list instanceof Set ) list = list.toObject();
		for (const entry of list) {
			const content = {id: entry._id};
			if(sync) content.item = fromUuidSync(entry.uuid ?? entry);
			else content.item = await fromUuid(entry.uuid ?? entry);
			arr.push(content);
		}
		return arr;
	}


	async prepareBenefits(){
		const item = this.item;
		const grantId = this.grant?.startsWith(item.type) ? '' : this.grant;
		const actor = this.item.parent.toObject(true);
		let level = this.level;
		if ( !level && ['class','path'].includes(item.type) ) {
			if ( grantId ) {
				level = item.system.benefits.find( i => i._id == grantId ).level;
			} else {
				level = item.system.level;
			}
		}
		let benefits = [];
		if ( grantId ) {
			let grant = item.system.benefits.find( i => i._id == grantId );
			await this.addGrant(grant, item);
			return;
		} else if ( level ) {
			benefits = item.system._benefits[level];
		} else {
			benefits = item.system._benefits;
		}
		console.log('benefits', benefits);
		// const benefits = level ? item.system._benefits[level] : item.system._benefits;
		for (const [key, data] of Object.entries(benefits)) {
			if ( key == 'grant' && data.length ) {
				for (const grant of data) {
					// if ( grantId && grant._id != grantId ) continue;
					await this.addGrant(grant, item);
				}
			} else if ( data.length ) {
				data.map( d => {
					d.item = fromUuidSync(d.uuid)
					d.id = d._id;
				});
				console.log('preAddStep', this);
				await this.addStep({
					title: game.i18n.localize(`TYPES.Item.${key}Pl`),
					list: data,
					originId: data._id,
					mode: key == 'heritage' ? 'radio' : 'checkbox',
				});
			}
		}
	}

	async addGrant(grant, item){
		const type = grant.granting; // TODO
		const mode = grant.quantity > 1 ? 'checkbox' : 'radio';
		const query = grant.query.split(/,|;/).map(i=> i.trim());
		let grantList = [];
		if ( type == 'feat' ) {
			// const featIdentifiers = item.parent.items.filter(i => query.includes(i.type) ).map( i => i.system.identifier);
			// query.push(...featIdentifiers);
			item.parent.items.filter( i => { 
				return query.includes(i.system.identifier) || query.includes(i.type);
			}).reduce((acc, i) => {
				let feats = i.system.feats.toObject().filter( f => {
					return !acc.find( i => i.uuid == f );
				}).map( f => ({
					uuid: f,
					item: fromUuidSync(f)
				}));
				if ( feats.length ) {
					const type = game.i18n.localize(`TYPES.Item.${i.type}`);
					feats[0].groupLabel = `${type} - ${i.name}`;
				}
				acc.push(...feats);
				return acc;
			}, grantList);
		}
		if ( type == 'spell' ) {
			// LIST SPELLS
		}
		if ( type == 'path' ) {
			const pack = game.packs.get('skyfall-core.character-creation');
			if ( pack ) {
				pack.index.filter( i => i.type == type).reduce((acc, i) => {
					acc.push({
						uuid: i.uuid,
						item: i,
					})
					return acc;
				}, grantList);
				// grantList.push(...pack.index.filter( i => i.type == type));
			} else {
				game.items.filter( i => i.type == type).reduce((acc, i) => {
					acc.push({
						uuid: i.uuid,
						item: i,
					})
					return acc;
				}, grantList);
				// grantList.push(...game.items.filter( i => i.type == type));
			}
		}
		if ( type == 'asi' ) {
			// LIST SPELLS
		}
		
		this.addStep({
			title: game.i18n.localize(`TYPES.Item.${type}Pl`),
			list: grantList,
			originId: grant._id,
			mode: mode,
		});
		
	}
	
	async addStep({title, list, mode, originId=null, sync=true}) {
		console.log('addStep', this.steps);
		this.steps.push({
			title: title,
			mode: mode,
			originId: originId,
			checkAll: (mode == 'checkbox') ? true : false,
			list: list, // await this.loadItems(list, sync),
		});
	}

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		return options;
	}

	/** @override */
	async _renderHTML(_context, _options) {
		_context.title = this.title;
		_context.buttons = this.options.buttons;
		_context.steps = this.steps;
		console.log(this.steps);
		return super._renderHTML(_context, _options);
	}

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */

	static _onClickButton(event, target) {
		if ( target.dataset.action == 'ok' ) this._onSubmit(target, event);
	}

	/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
	static async #onEdit(event, target) {
		const itemId = target.closest("[data-entry-id]")?.dataset.entryId;
		const document = await fromUuid(itemId);
		if ( !document ) return;
		document.sheet.render(true);
	}

	/** @inheritDoc */
	async _onSubmit(target, event) {
		event.preventDefault();
		const form = target.closest('dialog').querySelector('form');
		const fd = new FormDataExtended(form);
		const steps = Object.values(foundry.utils.expandObject(fd.object).create);
		const content = steps.map( s => s.filter(Boolean).map(i => i.split('|')) ).flat();

		const toCreate = [];
		for (const [grantId, uuid] of content) {
			const item = await fromUuid(uuid);
			const itemData = item.toObject();
			itemData._stats.compendiumSource = item.uuid;
			console.warn('system.origin', [grantId]);
			itemData.system.origin = [grantId],
			toCreate.push(itemData);
		}
		await this.item.parent.createEmbeddedDocuments("Item", toCreate);
		// this.render();
		await this.options.submit?.(fd.object);
		return this.close();
	}
}