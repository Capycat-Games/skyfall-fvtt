import Ability from "./ability.mjs";

/**
 * Data schema, attributes, and methods specific to Spell type Items.
 */
export default class Spell extends Ability {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return Object.assign(super.defineSchema(), {
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.spells, initial: "", label: "SKYFALL2.Type"}),
			components: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL2.ComponentPl"})),
		});
	}

	get spellLayer() {
		const layer = this.descriptors.includes('cantrip') ? 'cantrip'
			: this.descriptors.includes('superficial') ? 'superficial'
			: this.descriptors.includes('shallow') ? 'shallow'
			: this.descriptors.includes('deep') ? 'deep' : '';
		return layer;
	}

	get layerLabel() {
		if ( this.spellLayer ) {
			return game.i18n.localize(`SKYFALL.SPELLLAYERS.${this.spellLayer.toUpperCase()}`);
		} return '';
	}
}
