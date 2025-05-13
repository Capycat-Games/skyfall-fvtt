import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Armor type Items.
 */
export default class Armor extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			...this.equippableSchema(),
			/* leve | pesada | escudo */
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.armors, initial: "light", label:"SKYFALL2.Type"}),
			dr: new fields.NumberField({required: true, integer: true, min: 0, label:"SKYFALL2.DamageReduction"}),
			
			/* simples | marciais | fogo | regional */
			category: new fields.StringField({required: true, blank: false, choices: SYSTEM.weapons, initial: "simple", label:"SKYFALL2.Category"}),
			/* uma mão | duas mãos */
			attack: this.attackSchema(),
			damage: this.damageSchema(),
			rolls: new _fields.MappingField(new _fields.RollField()),
			sigils: new fields.ArrayField(new fields.SchemaField({
				uuid: new fields.StringField({required: true}, {validate: Armor.validateUuid}),
				parentUuid: new fields.StringField({required: true}, {validate: Armor.validateUuid}),
				infused: new fields.BooleanField({required:true, initial:false})
			}), {max: 4}),
		})
	}

	get isShield() {
		return this.type == 'shield';
	}

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		return await super._preUpdate(changed, options, user);
	}

	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */

	async weaponUse(event){
		if ( !this.isShield ) return;
		const actor = this.parent.actor;
		const weaponAbilitiesOptions = actor.items.filter(i =>{
			return i.type == 'ability' && i.system.descriptors.includes('weapon');
		}).map( i => {
			return `<label><input type="radio" name="abilityId" value="${i.id}"><img src="${i.img}" width="20px" height="20px" style="display:inline;"><span style="font-family:SkyfallIcons">${i.system.labels.action.icon}</span> ${i.name}</label><br>`
		}).join('');
		const abilityId = await foundry.applications.api.DialogV2.prompt({
			window: { title: "SKYFALL2.DIALOG.SelectAbilityItem" },
			content: weaponAbilitiesOptions,
			ok: {
				label: "SKYFALL2.Confirm",
				callback: (event, button, dialog) => button.form.elements.abilityId.value
			}
		});
		const ability = actor.items.get(abilityId);
		if ( !ability ) return;
		return ability.system.abilityUse(event, this.parent);
	}
}
