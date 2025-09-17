import SkyfallRoll from "../../dice/skyfall-roll.mjs";
const rollTerms = foundry.dice.terms;
const MODE = CONST.ACTIVE_EFFECT_MODES;

export default class ItemModification {

	static get isValidModification () {
		return [
			'item',
			'addRoll'
		];
	}
	/* -------------------------------------------- */
	/*  Item Modifiers                              */
	/* -------------------------------------------- */

	static callApplyItem(item, changes){
		for (const change of changes) {
			if ( change.type != 'item' ) continue;
			console.groupCollapsed('callApplyItem');
			try {
				if (change.key.startsWith('?')) continue;
				// const [handler, key] = change.key.split('_');
				// change.original = change.key;
				// if ( !ItemModification.isValidModification.includes(handler) ) continue;
				// change.key = key;
				// change.handler = handler;
				change.condition = new SkyfallRoll(change.key.replace(/\w+/,'1d6')).terms[0].options ?? {};
				change.value = SkyfallRoll.replaceFormulaData(change.value, {
					...item.parent.getRollData(), ...item.getRollData(),
				});
				console.log(item, change);
				this.apply(item, change);
				
			} catch (error) {
				console.groupEnd();
				console.log(item);
				console.log(change);
				console.error(error);
			}
			console.groupEnd();
		}
	}
	

	static apply(item, change){
		const fn = change.handler == 'item' ? this.applyToField : this[change.handler];
		if( !(fn instanceof Function) ) return item;
		console.log(item, change, fn);
		switch (fn.name) {
			case 'TODO':
			case 'TODO':
				fn.call(this, item, change);
				break;
			default:
				fn.call(this, item, change);
				break;
		}
	}

	static applyToField(item, change){
		let field;
		if ( change.key.startsWith("system.") ) {
			if ( item.system instanceof foundry.abstract.DataModel ) {
				field = item.system.schema.getField(change.key.slice(7));
			}
		} else field = item.schema.getField(change.key);
		if ( field ) {
			console.log('%c applyField ', 'background: #00FF00; color: #000;');
			ActiveEffect.applyField(item, change, field);
		}
	}

	static addRoll(item, change) {
		console.error('addRoll', item, change);
		switch (change.mode) {
			case MODE.CUSTOM:
			case MODE.OVERRIDE:
				break;
			case MODE.MULTIPLY:
				break;
			case MODE.ADD:
				const damageType =  ( change.key == 'damage' ? item.damageType : '' );
				const roll = new RollSF(change.value);
				const terms = roll.terms.reduce((acc, i) => {
					if ( i instanceof foundry.dice.terms.OperatorTerm ) return acc;
					acc.push({
						expression: i.expression,
						flavor: i.flavor ?? damageType ?? "",
					});
					return acc;
				}, [])
				item.system.rolls[change.effect.id] = {
					type: change.key,
					label: change.effect.parent.name,
					terms: terms,
				}
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
		}
	}
}