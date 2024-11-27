import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Consumable type Items.
 */
export default class Consumable extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			type: new fields.StringField({
				required: true,
				blank: true,
				choices: SYSTEM.consumables,
				initial: "ammo",
				label:"SKYFALL2.Type"
			}),
			damage: new fields.SchemaField({
				formula: new fields.StringField({
					required: true,
					blank: true,
					label:"SKYFALL2.Damage"
				}),
				abl: new fields.StringField({
					required: true,
					blank: false,
					choices:
					SYSTEM.abilities,
					initial: "str"
				}),
			}),
			packCapacity: new fields.NumberField({
				required: true,
				initial:1, min: 0,
				label:"SKYFALL.CAPACITY"
			}),
			uses: new fields.SchemaField({
				value: new fields.NumberField({
					required: true,
					min: 0,
					integer: true,
					label: "SKYFALL.ITEM.LIMITEDUSES"
				}),
				max: new fields.NumberField({
					required: true,
					min: 0,
					integer: true,
					label: "SKYFALL.ITEM.LimitedUsesMax"
				}),
				per: new fields.StringField({
					required: true,
					nullable: true,
					blank: false,
					initial: null,
					label: "SKYFALL.ITEM.LimitedUsesPer"
				}),
			}, {required: false}),
		})
	}
}