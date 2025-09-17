import SkyfallRoll from "../../dice/skyfall-roll.mjs";
const {
	Coin, DiceTerm, Die, FateDie, FunctionTerm, NumericTerm, OperatorTerm, ParentheticalTerm, PoolTerm, RollTerm, StringTerm
} = foundry.dice.terms;
const MODE = CONST.ACTIVE_EFFECT_MODES;

export default class EffectModification {
	
	static get isValidModification () {
		return [
			'includeEffect',
			'includeChange', // includeChange_system.dr
			'applyToChange',
			'applyToNumber',
			'applyToFormula',
			'effect', // BASE EFFECT MANIPULATION
		];
		
	}
	/* -------------------------------------------- */
	/*  Effects Modifiers                           */
	/* -------------------------------------------- */
	
	static callApplyEffect(effects, changes){
		// return;
		// this.applyEffectList(effects, change);
		for (const change of changes) {
			if ( change.type != 'effect' ) continue;
			try {
				// const [handler, key] = change.key.split('_');
				// change.original = change.key;
				// if ( !EffectModification.isItemModification.includes(handler) ) continue;
				change.handler = change.handler == 'effect' ? 'applyToChange' : change.handler;
				// change.key = key;
				change.condition = new SkyfallRoll(change.key.replace(/\w+/,'1d6')).terms[0].options ?? {};
				
				if ( change.handler == 'includeEffect' ) {
					const effect = {};
					effect.effects = effects;
					EffectModification.apply(effect, change);
					continue;
				}
				for (const effect of effects) {
					change.value = SkyfallRoll.replaceFormulaData(change.value, effect.rolldata);
					effect.effects = effects;
					// effect.rolldata = actor.getRollData();
					EffectModification.apply(effect, change);
				}
				
			} catch (error) {
				console.groupEnd();
				console.log(effects);
				console.log(change);
				console.error(error);
			}
		}
	}

	
	/**
	 * 
	 * @param {Object} effect 
	 * @param {Object} change             Object ActiveEffect.changes
	 * @param {String} change.path        Target property and function
	 * @param {Int} change.mode           Change Mode from CONST.ACTIVE_EFFECT_MODES
	 * @param {String} change.value       Value modifing the target property
	 * @param {Boolean} change.multiply   Check if it allows multiple application
	 * @param {Int} change.apply          Amount of time applied
	 * @returns 
	 */
	
	static apply(effect, change){
		const fn = change.handler ? this[change.handler] : this.applyToChange;
		console.log(effect, change, fn);
		if( !(fn instanceof Function) ) return effect;
		console.log(effect, change, fn);
		switch (fn.name) {
			case 'includeEffect':
			case 'includeChange':
				fn.call(this, effect, change);
				break;
			default:
				
				
				for (const _change of effect.changes) {
					console.warn(_change, change);
					if ( change.key != '*' && change.key != _change.key ) continue;
					fn.call(this, _change, change);
					console.warn(_change, change);
				}
				break;
		}
	}

	static includeEffect(effect, change) {
		const statusEffect = SYSTEM.conditions[change.value];
		if ( statusEffect && !effect.effects.find(i => i.id == statusEffect.id) ) {
			effect.effects.push(statusEffect);
		}
	}

	static includeChange(effect, change) {
		if (change.condition.flavor == effect.name) {
			effect.changes.push({
				key: change.key,
				mode: change.mode,
				value: change.value,
				priority: change.priority,
			});
		}
	}

	static applyToChange(_change, change) {
		console.log('applyToChange');
		console.log(_change, change);
		const terms = SkyfallRoll.parse(_change.value);
		console.log(terms);
		if ( terms[0] instanceof NumericTerm ) {
			_change.value = Number(_change.value);
			change.value = Number(change.value);
			if( isNaN(change.value) ) return;
			this.applyToNumber(_change, change);
		} else if ( terms[0] instanceof DiceTerm ) {
			this.applyToFormula(_change, change);
		} else if ( terms[0] instanceof StringTerm ) {
			this.applyToString(_change, change);
		} else {
			
		}
	}

	static applyToNumber(_change, change) {
		if ( change.multiply ) change.value *= change.apply;
		switch (change.mode) {
			case MODE.CUSTOM:
				break;
			case MODE.ADD:
				_change.value += _change.value;
				break;
			case MODE.MULTIPLY:
				_change.value *= _change.value;
				break;
			case MODE.DOWNGRADE:
				_change.value = Math.min(change.value, change.value) || _change.value;
				break;
			case MODE.UPGRADE:
				_change.value = Math.max(change.value, change.value) || _change.value;
				break;
			case MODE.OVERRIDE:
				_change.value = change.value;
				break;
		}
	}

	static applyToFormula(targetChange, change) {
		const roll = new SkyfallRoll(targetChange.value, targetChange.rolldata);
		RollModification.applyRoll(roll, change);
		targetChange.value = roll._formula;
		if ( change.multiply ) change.value *= change.apply;
		switch (change.mode) {
			case MODE.CUSTOM:
				break;
			case MODE.ADD:
				targetChange.value += _change.value;
				break;
			case MODE.MULTIPLY:
				_change.value *= _change.value;
				break;
			case MODE.DOWNGRADE:
				_change.value = Math.min(change.value, change.value) || _change.value;
				break;
			case MODE.UPGRADE:
				_change.value = Math.max(change.value, change.value) || _change.value;
				break;
			case MODE.OVERRIDE:
				_change.value = change.value;
				break;
		}
	}
}