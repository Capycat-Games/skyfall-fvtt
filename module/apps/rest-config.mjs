
const {HandlebarsApplicationMixin, ApplicationV2, DialogV2} = foundry.applications.api;
const {renderTemplate} = foundry.applications.handlebars;
export default class RestConfig extends HandlebarsApplicationMixin(DialogV2) {
	constructor(options){
		// options.window.title = "SKYFALL2.APP.Rest";
		super(options);
		this.actor = options.actor;
		const proficiency = this.actor.system.proficiency;
		this.consumed = { value: 0, max: proficiency };
		console.log(this.actor);
		this.updateData = {
			"system.resources.hp.value": this.actor.system.resources.hp.value,
			"system.resources.hp.temp": this.actor.system.resources.hp.temp,
			"system.resources.ep.value": this.actor.system.resources.ep.value + proficiency,
			"system.resources.ep.temp": this.actor.system.resources.ep.temp,
			"system.resources.catharsis.value": this.actor.system.resources.catharsis.value,
			"items": []
		}
		console.log(this.updateData);
		this.recovered = {
			hp: {value: 0, temp: 0},
			ep: {value: proficiency, temp: 0},
			catharsis: {value: 0}
		}
		this.message = null;
	}

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		id: "rest-config",
		classes: ["dialog","skyfall", "sheet", "rest-config", "standard-form"],
		tag: "dialog",
		window: {
			title: "SKYFALL2.APP.ShortRest",
			frame: true,
			positioned: true,
			minimizable: false
		},
		buttons: [
			{
				type: "submit", action: "ok", label: "Confirm", default: true,
				callback: (event, button, dialog) => button.form.elements.choice.value
			},
		],
		actions: {
			roll: RestConfig.#roll,
		}
	};

	/** @override */
	static PARTS = {
		rest: {
			template: "systems/skyfall/templates/apps/rest-config.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};
	
	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		return options;
	}

	/** @override */
	async _renderHTML(_context, _options) {
		_context.actor = this.actor;
		_context.hitDies = this.prepareHitDies(),
		_context.consumed = this.consumed,
		_context.message = this.message,
		_context.quality = this.quality ?? 'default',
		_context._quality = {
			'bad': "SKYFALL2.APP.REST.Bad",
			'default': "SKYFALL2.APP.REST.Default",
			'good': "SKYFALL2.APP.REST.Good"
		}

		_context.buttons = this.options.buttons;
		const form = await super._renderHTML(_context, _options);
		// form.addEventListener("submit", event => this._onSubmit(event.submitter, event));
		const quality = form.rest.querySelector('.quality');
		quality.addEventListener("change", event => {
			this.quality = event.currentTarget.value;
			this.render();
		});
		
    return form;
	}

	
	prepareHitDies(){
		const classes = this.actor.items.filter(it => it.type == 'class');
		const modifiers = this.actor.system.modifiers.rest;
		const hitDies = [];
		for (const cls of classes) {
			modifiers.bonusHP = [] //
			modifiers.bonusHPtemp = [] //
			modifiers.bonusEP = [] //
			modifiers.bonusEPtemp = [] //
			modifiers.bonusCatharsis = [] //
			modifiers.hitDieBonus = [] //
			modifiers.hitDieMod = [] //
			
			const hdData = {
				_formula: `@hitDie@hitDieMods @hitDieBonus`,
				formula: `@hitDie@hitDieMods @hitDieBonus`,
				name: cls.name,
				id: cls.id,
				...cls.system.hitDie
			}
			if ( this.quality == 'bad' ){
				if ( hdData.die == '1d10' ) hdData.die = '1d8';
				else if ( hdData.die == '1d8' ) hdData.die = '1d6';
				else if ( hdData.die == '1d6' ) hdData.die = '1d4';
			} else if (this.quality == 'good' ){
				modifiers.hitDieBonus.push('1d6');
			}
			
			const rollData = {
				...this.actor.getRollData(),
				hitDie: hdData.die,
				hitDieMods: modifiers?.rest?.hitDieMod?.join('') ?? '',
				hitDieBonus: ["+@con"].concat(modifiers?.hitDieBonus ?? []).join('+'),
			}
			let roll = new Roll(hdData._formula, rollData);
			roll = new Roll(roll.formula, rollData);
			hdData.formula = roll.formula;
			hitDies.push(hdData);
		}
		return hitDies;
	}

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */

	static async #roll(event, target) {
		const classId = target.dataset.entryId;
		const formula = target.dataset.formula;
		const classItem = this.actor.items.find(it => it.id == classId);
		const resources = this.actor.system.resources;
		const proficiency = this.actor.system.proficiency;
		if ( !classItem ) return;
		// Prepare item update - reducing current hitDie;
		if ( this.updateData.items.findIndex(it => it._id == classItem.id) >=0 ) {
			const index = this.updateData.items.findIndex(it => it._id == classItem.id);
			this.updateData.items[index]['system.hitDie.value'] -= 1;
		} else {
			const updateItem = {
				"_id": classItem.id,
				"system.hitDie.value": classItem.system.hitDie.value - 1
			}
			this.updateData.items.push(updateItem);
		}
		// Evaluate hitDie Roll
		const roll = new RollSF(formula,{},{flavor:classItem.name});
		await roll.evaluate();
		roll.options.template = await roll.render();
		
		// Track Recovered
		this.recovered.hp.value += roll.total;
		this.recovered.ep.value += proficiency;
		
		// Prepare Actor Update
		this.updateData["system.resources.hp.value"] += roll.total;
		this.updateData["system.resources.ep.value"] += proficiency;
		const hppath = "system.resources.hp.value";
		const eppath = "system.resources.ep.value";
		this.updateData[hppath] = Math.min( this.updateData[hppath], resources.hp.max );
		this.updateData[eppath] = Math.min( this.updateData[eppath], resources.ep.max );
		
		// Prepare Message
		const messageData = {
			rolls: !this.message ? [roll] : this.message.rolls.concat(roll),
			actor: this.actor,
			system: {
				restUpdate: this.updateData,
				recovered: {
					hp: this.updateData['system.resources.hp.value'] - resources.hp.value,
					ep: this.updateData['system.resources.ep.value'] - resources.ep.value,
				}
			}
		}
		// Render Template
		let template = `systems/${SYSTEM.id}/templates/chat/rest.hbs`;
		const html = await renderTemplate(template, messageData);
		messageData.content = html;

		if ( !this.message ) this.message = await ChatMessage.create(messageData);
		else await this.message.update(messageData);
		
		
		// Update class resources
		await classItem.update({"system.hitDie.value": classItem.system.hitDie.value - 1 });
		this.consumed.value += 1;
		this.render();
	}

	async changeQuality(ev, event){
		event.preventDefault();
	}

	/** @inheritDoc */
	async _onSubmit(target, event) {
		event.preventDefault();
		return this.close();
	}
}