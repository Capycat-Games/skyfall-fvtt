export default class ShortRest extends FormApplication {
	constructor(actor, options={}) {
		super(actor, options);
		this.actor = actor;
		const proficiency = this.actor.system.proficiency;
		this.consumed = { value: 0, max: proficiency };
		this.updateData = {
			"system.resources.hp.value": this.actor.system.resources.hp.value,
			"system.resources.hp.temp": this.actor.system.resources.hp.temp,
			"system.resources.ep.value": this.actor.system.resources.ep.value + proficiency,
			"system.resources.ep.temp": this.actor.system.resources.ep.temp,
			"system.resources.catharsis.value": this.actor.system.resources.catharsis.value,
			"items": []
		}
		this.recovered = {
			hp: {value: 0, temp: 0},
			ep: {value: proficiency, temp: 0},
			catharsis: {value: 0}
		}
		this.message = null;
	}

	/* -------------------------------------------- */

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["skyfall","rest-config"],
			width: 400,
			height: "auto"
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get title() {
		return `[${game.i18n.localize('SKYFALL.SHORTREST')}] ${this.actor.name}`;
	}

	/* -------------------------------------------- */

	get template() {
		return `systems/skyfall/templates/apps/rest-config.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	async getData(options) {
		return {
			actor: this.actor,
			hitDies: this.prepareHitDies(),
			consumed: this.consumed,
			message: this.message,
			quality: this.quality ?? 'default',
			_quality: {'bad':"SKYFALL.REST.BAD",'default':"SKYFALL.REST.DEFAULT",'good':"SKYFALL.REST.GOOD"}
		};
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
			console.log(this.quality, hdData.die);
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
			console.log(hdData);
			hitDies.push(hdData);
		}
		return hitDies;
	}

	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */
	
	activateListeners(html) {
		html.on("click", '[data-action="roll"]', this.onRollHitDice.bind(this));
		html.on("change", ".quality", (ev)=>{
			this.quality = ev.currentTarget.value;
			this.render();
		});
	}

	async onRollHitDice(event) {
		const button = event.currentTarget;
		const classId = button.dataset.entryId;
		const formula = button.dataset.formula;
		const classItem = this.actor.items.find(it => it.id==classId);
		const resources = this.actor.system.resources;
		const proficiency = this.actor.system.proficiency;
		console.log(classId, formula, classItem)
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
		else this.message.update(messageData);
		
		// Update class resources
		await classItem.update({"system.hitDie.value": classItem.system.hitDie.value - 1 });
		this.consumed.value += 1;
		this.render();
	}

	static async #onSubmit(event, form, formData) {
		
	}
}