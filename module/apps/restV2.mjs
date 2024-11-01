import SkyfallRoll from "../dice/skyfall-roll.mjs";

export default class ShortRestV2 extends foundry.applications.api.ApplicationV2 {
	constructor(options={}) {
		super(options);
		this.actor = options.actor;
		const proficiency = options.actor.system.proficiency;
		this.consumed = { value: 0, max: proficiency };
		this.updateData = {
			"system.resources.hp.value": this.actor.system.resources.hp.value,
			"system.resources.hp.temp": this.actor.system.resources.hp.temp,
			"system.resources.ep.value": this.actor.system.resources.ep.value + proficiency,
			"system.resources.ep.temp": this.actor.system.resources.ep.temp,
			"system.resources.catharsis.temp": this.actor.system.resources.catharsis.value,
			"items": []
		}
	}
	actor = null;
	message = null;
	consumed = null;
	updateData = {};

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		id: "rest-config",
		tag: "form",
		window: {
			contentClasses: ["skyfall", "rest-config", "standard-form"],
			icon: "fa-solid fa-utensils",
			title: "SKYFALL.SHORTREST", //`[] ${this.actor.name}`,
			minimizable: false,
		},
		position: {
			width: 400,
			height: "auto"
		},
		form: {
			closeOnSubmit: true,
			handler: ShortRestV2.#onSubmit
		},
		actions: {
			roll: ShortRestV2.onRollHitDice
		}
	};

	/** @override */
	static PARTS = {
		form: {
			// id: "short-rest",
			template: "systems/skyfall/templates/apps/rest-config.hbs",
			// scrollable: [".permissions-list"]
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @override */
  async _prepareContext(_options={}) {
		return {
			actor: this.actor,
			hitDies: this.prepareHitDies(),
			consumed: this.consumed,
			message: this.message,
			quality: this.quality,
			_quality: {'bad':"bad",'default':"default",'good':"good"}
		};
	}

	async _renderHTML(context, options) {
		return renderTemplate(this.template, context);
	}
	_replaceHTML(result, content, options) {
		content.insertAdjacentHTML("beforeend", result);
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
				...cls.system.hitDie
			}
			if ( this.quality == 'bad' ){
				if ( hdData.die == '1d10' ) hdData.die == '1d8';
				else if ( hdData.die == '1d8' ) hdData.die == '1d6';
				else if ( hdData.die == '1d6' ) hdData.die == '1d4';
			}
			const rollData = {
				...this.actor.getRollData(),
				hitDie: hdData.die,
				hitDieMods: modifiers?.rest?.hitDieMod?.join('') ?? '',
				hitDieBonus: ["+@con"].concat(modifiers?.rest?.hitDieBonus ?? []).join('+'),
			}
			hdData.formula = new SkyfallRoll(hdData._formula, rollData).formula;
			
			hitDies.push(hdData);
		}
		return hitDies;
	}

	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */
	static async onRollHitDice(event) {
		return;
		// const button = event.
		const formula = button.dataset.formula;
		const classId = button.dataset.classId;
		const classItem = this.actor.find(it => it.id==classId);
		if ( !classItem ) return;
		// Prepare item update - reducing current hitDie;
		if ( this.updateData.items.findIndex(it => it._id == classItem.id) ) {
			const index = this.updateData.items.findIndex(it => it._id == classItem.id);
			this.updateData.items[index]['system.hitDie.value'] -= 1;
		} else {
			const updateItem = {
				"_id": classItem.id,
				"system.hitDie.value": classItem.system.hitDie.value - 1
			}
		}
		// Evaluate hitDie Roll
		const roll = new RollSF(formula,{},{flavor:classItem.name});
		roll.evaluate();

		// Prepare Actor Update
		

		// Prepare Message
		if ( !this.message ) {
			// Render Template
			// 
			const messageData = {
				flags: {
					skyfall: {
						restUpdate: this.updateData
					}
				}
			}
			this.message = await ChatMessage.create(messageData);
		} else {
			// Update message 
			this.message.update({
				rolls: this.message.rolls.concat(roll),
				"flags.skyfall.restUpdate": this.updateData
			})
		}
	}

	static async #onSubmit(event, form, formData) {
		
	}
}