import ActorConfigurationSheet from '../../sheetsV2/actor-config.mjs';
import SkyfallDataModel from './data-skyfall.mjs';

export default class InitiativeData extends SkyfallDataModel {
	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		return {
			abilities: new _fields.ArrayField(
				new fields.StringField({}), {
					choices: skyfall.utils.keyPairObject(
						SYSTEM.abilitiesCore, 'abbr'
					),
					initial: ['dex'],
					type: "checkboxes",
					label: "SKYFALL2.AbilityPl",
				}
			),
			bonus: new fields.NumberField({
				required: true,
				nullable: false,
				integer: true,
				initial: 0,
				label: "SKYFALL2.Bonus",
			}),
			bonuses: new _fields.RollTermsField({
				hidden: ["flavor", "condition", "data"],
				label: "SKYFALL2.BONUSES.RollBonus",
			}),
		}
	}
	
	/* -------------------------------------------- */
	/*  Getters/Setters                             */
	/* -------------------------------------------- */
	
	get sheet(){
		return new ActorConfigurationSheet({
			document: this.document,
			fieldPath: this.schema.fieldPath,
			skyfallConfig: this,
			skyfallConfigParts: ["initiative"],
		}).render(true);
	}

	/* -------------------------------------------- */
	/*  System Operations                           */
	/* -------------------------------------------- */
	
	get roll() {
		const rollData = this.document.getRollData();
		const bonuses = [...this.bonuses];
		const terms = [];
		terms.push( `${this.bonus}[||bonus]` );
		terms.push( ...bonuses.map( i => `${i.value ?? 0}[||${i.source ?? '-'}]`));
		
		const roll = new SkyfallRoll( terms.join(' + '), rollData );
		return roll;
	}

	get total() {
		const roll = this.roll;
		if ( !roll.isDeterministic ) {
			ui.notifications.error("SKYFALL.RESOURCE.NonDeterministic", {
				localize: true
			});
			return 0;
		}
		return roll.evaluateSync().total;
	}

	/* -------------------------------------------- */
	/*  Apply Effect                                */
	/* -------------------------------------------- */
	
	apply() {
		
	}
	
	_prepareData() {
		
	}
}