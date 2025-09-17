import ActorConfigurationSheet from '../../sheetsV2/actor-config.mjs';
import SkyfallDataModel from './data-skyfall.mjs';

export default class SkillData extends SkyfallDataModel {
	
	/** @inheritDoc */
	static defineSchema(key = 'acro') {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		const SKILLS = {};
		foundry.utils.mergeObject(SKILLS, SYSTEM.coreSkills);
		foundry.utils.mergeObject(SKILLS, SYSTEM.aptitudeSkills);

		return {
			value: new fields.NumberField({
				required: true,
				nullable: false,
				integer: true,
				max: 2,
				min: 0,
				initial: 0,
				label: "SKYFALL.DM.RANK"
			}),
			custom: new fields.BooleanField({
				initial: false
			}),
			name: new fields.StringField({
				required: true,
				blank: true,
				initial: "",
				label: "SKYFALL2.Name",
			}),
			bonus: new fields.NumberField({
				required: true,
				nullable: false,
				integer: true,
				initial: 0,
				label: "SKYFALL2.Bonus",
			}),
			bonuses: new _fields.RollTermsField({
				hidden: ["flavor", "data"],
				label: "SKYFALL2.BONUSES.RollBonus",
			}),
		};
	}
	
	
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */
	/*  Getters/Setters                             */
	/* -------------------------------------------- */
	// get label() {
	// 	return this.name;
	// }

	get sheet(){
		return new ActorConfigurationSheet({
			document: this.document,
			fieldPath: `system.skills.${this.id}`,
			id: this.id,
			skyfallConfig: this,
			skyfallConfigParts: ["skill"],
		}).render(true);
	}

	get contextMenu(){
		ui.context.menuItems = ['edit', 'delete'].map( action => {
		// 'journal', 
			return {
				name: `SKYFALL.${action.titleCase()}`,
				icon: SYSTEM.icons[action],
				callback: async (li) => {
					const skill = this;
					if ( action == 'edit' ) skill.sheet;
					else if ( action == 'delete' ) {
						const doc = this.document;
						const updateData = {};
						updateData[`system.skills.-=${this.name}`] = null;
						await doc.update(updateData);
					}
				}
			}
		});
	}

	get roll() {
		const rollData = this.document.getRollData();
		const bonuses = [...this.bonuses];
		const terms = [];
		if ( this.value ) {
			terms.push( `(${this.value} * @proficiency)[|proficiency|proficiency]` );
		}
		// terms.push( `@${ability}[||ability]` );
		terms.push( `${this.bonus}[||bonus]` );
		terms.push( ...bonuses.map( i => `${i.value ?? 0}[||${i.source ?? '-'}]`));
		const roll = new SkyfallRoll( terms.join(' + '), rollData );
		return roll;
	}

	get total() {
		const roll = this.roll;
		return ( roll.isDeterministic ? roll.evaluateSync().total : 0 );
	}
	
	/* -------------------------------------------- */
	/*  System Operations                           */
	/* -------------------------------------------- */
	
	_prepareData() {
		
	}
	
	/* -------------------------------------------- */
	/*  Apply Effect                                */
	/* -------------------------------------------- */
	
	apply() {
		
	}
	
}