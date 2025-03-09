import SkyfallRoll from "../../dice/skyfall-roll.mjs";
const {
	Coin, DiceTerm, Die, FateDie, FunctionTerm, NumericTerm, OperatorTerm, ParentheticalTerm, PoolTerm, RollTerm, StringTerm
} = foundry.dice.terms;
const MODE = CONST.ACTIVE_EFFECT_MODES;

export default class RollModification {
	
	static get isValidModification () {
		return [
			'addTerm',
			'criticalRange',
			'damageType',
			'perDie',
			'targetDR',
			'targetIRV',

			'targetResistance',
			'targetImunity',
			'targetNormal',
			'targetVulnerability',

			'dieModifier',
			'advantage',
			'disadvantage',
			'advantageExtra',
			'disadvantageExtra',
			'dieFaces',
			'dieCategory',
			'dieNumber',
			'dieAmount',
			'dieQuantity',
			'numericValue'
		]
	}

	/* -------------------------------------------- */
	/*  Roll Modifiers                              */
	/* -------------------------------------------- */
	
	static callApplyRoll(roll, changes){
		for (const change of changes) {
			if ( change.type != 'roll' ) continue;
			console.groupCollapsed('applyRoll');
			console.error(roll, change);
			try {
				if (change.key.startsWith('?')) continue;
				// const [handler, key] = change.key.split('_');
				// if ( !RollModification.isValidModification.includes(handler) ) continue;
				// console.log(handler, key);
				if ( !change.key.startsWith(roll.options.type) ) {
					console.groupEnd();
					continue;
				}
				// change.key = key;
				// change.handler = handler;
				change.condition = new SkyfallRoll(change.key.replace(/\w+/,'1d6')).terms[0].options ?? {};
				// change.value = SkyfallRoll.replaceFormulaData(change.value, roll.data);
				console.log(roll, change);
				RollModification.apply(roll, change);
			} catch (error) {
				console.groupEnd();
				console.log(roll);
				console.log(change);
				console.error(error);
			}
			console.groupEnd();
		}
	}
	
	
	/**
	 * 
	 * @param {Object} roll 
	 * @param {Object} change             Object ActiveEffect.changes
	 * @param {String} change.path        Target property and function
	 * @param {Int} change.mode           Change Mode from CONST.ACTIVE_EFFECT_MODES
	 * @param {String} change.value       Value modifing the target property
	 * @param {Boolean} change.multiply   Check if it allows multiple application
	 * @param {Int} change.apply          Amount of time applied
	 * @returns 
	 */
	static apply(roll, change){
		const fn = change.handler ? this[change.handler] : this.addTerm;
		if( !(fn instanceof Function) ) return roll;
		switch (fn.name) {
			// Not term transform functions
			case 'addTerm':
			case 'criticalRange':
			case 'perDie':
			case 'targetDR':
				fn.call(this, roll, change);
				break;
			case 'targetResistance':
			case 'targetImunity':
			case 'targetNormal':
			case 'targetVulnerability':
				const property = fn.name.replace('target','').toLowerCase();
				RollModification.targetIRV(roll, change, property);
				break;
			// Term transform functions
			default:
				const validTerms = [];
				if ( fn.name.startsWith('die') ) validTerms.push(DiceTerm);
				if ( fn.name.startsWith('numeric') ) validTerms.push(NumericTerm);
				
				console.log(roll.terms);
				for (const term of roll.terms) {
					if ( !RollModification.validateTermType(term, validTerms) ) continue;
					if ( !RollModification.validateCondition(term, change.condition) ) continue;

					console.groupCollapsed(fn.name);
					console.log(term, change);
					fn.call(this, term, change);
					console.groupEnd();
				}
				break;
		}
		roll.resetFormula();
		return roll;
	}
	
	// ROLL TRANSFORM
	static addTerm(roll, change) {
		console.error(roll, change );
		// let temp = new SkyfallRoll(change.value, roll.data);
		let temp = SkyfallRoll.fromSkyfallTerms([change.value], roll.data);
		console.log(temp);
		change.isAmplify = change.effect.system.apply.type.includes('amplify');
		if ( change.isAmplify ) {
			change.amplifyThreshold = change.effect.system.apply.amplifyThreshold;
			temp.terms.forEach( t => t.options.amplify = change.amplifyThreshold );
		}
		console.error(temp);
		let allowed = ( change.condition ? false : true );
		for (const term of roll.terms) {
			if ( !RollModification.validateTermType(term, [DiceTerm, NumericTerm]) ) continue;
			console.log(term, change)
			if ( !RollModification.validateCondition(term, change.condition) ) continue;
			allowed = true;
		}
		if ( change.condition && !allowed ) return;
		switch (change.mode) {
			case MODE.CUSTOM:
			case MODE.ADD:
				let operator = new OperatorTerm({operator: '+'});
				if ( change.isAmplify ) {
					operator.options.amplify = change.amplifyThreshold;
				}
				roll.terms.push(operator);
				roll.terms.push( ...temp.terms );
				break;
			case MODE.MULTIPLY:
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
			case MODE.OVERRIDE:
				roll.terms = temp.terms;
				break;
		}
	}

	static criticalRange(roll, change) {
		change.value = Number(change.value);
		if ( isNaN(change.value) ) return roll;
		if( change.multiply ) change.value *= change.apply;
		switch (change.mode) {
			case MODE.CUSTOM:
				break;
			case MODE.MULTIPLY:
				roll.options.critical.range *= change.value;
				break;
			case MODE.ADD:
				roll.options.critical.range += change.value;
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
			case MODE.OVERRIDE:
				roll.options.critical ??= {};
				roll.options.critical.range = change.value;
				break;
		}
		return roll;
	}

	static damageType(roll, change) {
		if ( !SYSTEM.DESCRIPTOR.DAMAGE[change.value] ) return roll;
		for (const term of roll.terms) {
			if ( !RollModification.validateTermType(term, [DiceTerm, NumericTerm]) ) continue;
			if ( !RollModification.validateCondition(term, change.condition) ) continue;
			
			switch (change.mode) {
				case MODE.CUSTOM:
				case MODE.OVERRIDE:
					term.options.flavor = change.value;
					break;
				case MODE.ADD:
				case MODE.MULTIPLY:
				case MODE.DOWNGRADE:
				case MODE.UPGRADE:
					break;
			}
		}
	}
	
	static perDie(roll, change) {
		const temp = new SkyfallRoll(change.value, roll.data);
		// change.value = Number(temp.expression);
		// if( isNaN(change.value) ) return roll;
		if( change.multiply ) {
			temp.terms.forEach( t => { if ( t.number ) t.number *= change.apply});
		}
		let acc = 0;
		for (const term of roll.terms) {
			if ( !RollModification.validateTermType(term, [DiceTerm]) ) continue;
			if ( !RollModification.validateCondition(term, change.condition) ) continue;
			acc += term.number; // * change.value;
		}
		// let temp = new SkyfallRoll( `${acc}`, roll.data);
		temp.terms.forEach( t => { if ( t.number ) t.number *= acc});
		switch (change.mode) {
			case MODE.CUSTOM:
			case MODE.ADD:
				let operator = new OperatorTerm({operator: '+'});
				roll.terms.push(operator);
				roll.terms.push( ...temp.terms );
				break;
			case MODE.MULTIPLY:
			case MODE.DOWNGRADE:
			case MODE.UPGRADE:
			case MODE.OVERRIDE:
				break;
		}
	}

	// TARGET TRANSFORM
	static targetDR(roll, change) {
		change.value = SkyfallRoll.replaceFormulaData(change.value, roll.data);
		change.value = Number(change.value);
		if( isNaN(change.value) ) return roll;
		if( change.multiply ) change.value *= change.apply;
		roll.options.target ??= {};
		roll.options.target.dr ??= 0;
		switch (change.mode) {
			case MODE.CUSTOM:
				break;
			case MODE.MULTIPLY:
				roll.options.target.dr *= change.value;
				break;
			case MODE.ADD:
				roll.options.target.dr += change.value;
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
			case MODE.OVERRIDE:
				roll.options.target.dr = change.value;
				break;
		}
	}

	static targetIRV(roll, change, property) {
		const temp = new SkyfallRoll(change.value, roll.data).terms[0];
		const damageType = temp.flavor ?? 'all';
		change.value = Number(temp.expression);
		if( isNaN(change.value) ) return term;
		if( change.multiply ) change.value *= change.apply;
		roll.options.target ??= {};
		roll.options.target.irv ??= {};
		roll.options.target.irv[damageType] ??= {}
		// irv = {
		// 	fire: {imunity: 'resistance', resistance: 'normal', normal: 'vulnerability'}
		// }
		const irvrank = ["vulnerability", "normal", "resistance", "imunity"];
		switch (change.mode) {
			case MODE.CUSTOM:
			case MODE.MULTIPLY:
			case MODE.ADD:
				break;
			case MODE.DOWNGRADE:
				if ( irvrank.indexOf(property) > irvrank.indexOf(change.value) ) {
					roll.options.target.irv[damageType][property] = change.value;
				}
				break;
			case MODE.UPGRADE:
				if ( irvrank.indexOf(property) < irvrank.indexOf(change.value) ) {
					roll.options.target.irv[damageType][property] = change.value;
				}
				break;
			case MODE.OVERRIDE:
				roll.options.target.irv[damageType][property] = change.value;
				break;
		}
	}
	
	// DIE TRANSFORM
	static dieModifier(term, change) {
		console.error('dieModifier', term, change);
		if ( !(term instanceof Die) ) return;
		switch (change.mode) {
			case MODE.CUSTOM:
				break;
			case MODE.MULTIPLY:
				break;
			case MODE.ADD:
				if ( change.value == 'kh' && term.modifiers.includes('kl') ) {
					term.modifiers.findSplice( m => m == 'kl' );
				} else if ( change.value == 'kl' && term.modifiers.includes('kh') ) {
					term.modifiers.findSplice( m => m == 'kh' );
				} else {
					term.modifiers.push(change.value);
					if ( term.modifiers.includes('kh') || term.modifiers.includes('kl') ) {
						term.number = 2;
					}
					if ( term.modifiers.includes('khe') || term.modifiers.includes('kle') ) {
						term.number = 3;
					}
				}
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
			case MODE.OVERRIDE:
				term.modifiers = [change.value];
				break;
		}
		return term;
	}

	static advantage(term, change) {
		return this.dieModifier(term, change);
	}
	static disadvantage(term, change) {
		return this.dieModifier(term, change);
	}
	static advantageExtra(term, change) {
		return this.dieModifier(term, change);
	}
	static disadvantageExtra(term, change) {
		return this.dieModifier(term, change);
	}

	static dieFaces(term, change) {
		
		change.value = Number(change.value);
		if( isNaN(change.value) ) return term;
		if( change.multiply ) change.value *= change.apply;
		switch (change.mode) {
			case MODE.CUSTOM:
				break;
			case MODE.MULTIPLY:
				term.faces *= change.value;
				break;
			case MODE.ADD:
				term.faces += change.value;
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
			case MODE.OVERRIDE:
				term.faces = change.value;
				break;
		}
	}

	static dieCategory(term, change) {
		console.warn('dieCategory');
		change.value = Number(change.value);
		if( isNaN(change.value) ) return term;
		if( change.multiply ) change.value *= change.apply;
		const expression = term.expression.replaceAll(term.modifiers,'');
		let updated = SYSTEM.damageCategories.indexOf(expression) + change.value;
		updated = Math.clamped(updated, 0, SYSTEM.damageCategories.length );
		let die = SYSTEM.damageCategories[updated] ?? expression;
		die = new Roll(die).terms[0];
		
		switch (change.mode) {
			case MODE.CUSTOM:
			case MODE.OVERRIDE:
			case MODE.ADD:
				term.number = die.number;
				term.faces = die.faces;
				break;
			case MODE.MULTIPLY:
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
		}
	}

	static dieNumber(term, change) {
		return RollModification.dieQuantity(term, change);
	}

	static dieAmount(term, change) {
		return RollModification.dieQuantity(term, change);
	}
	
	static numericValue(term, change) {
		return RollModification.dieQuantity(term, change);
	}

	static dieQuantity(term, change) {
		change.value = Number(change.value);
		if( isNaN(change.value) ) return term;
		if( change.multiply ) change.value *= change.apply;
		switch (change.mode) {
			case MODE.CUSTOM:
			case MODE.OVERRIDE:
				if ( change.value == 0 ) {
					term.options.ignore = true;
				} else if ( term.options.ignore ) {
					term.options.ignore = false;
				} else {
					term.number = change.value;
				}
				break;
			case MODE.MULTIPLY:
				term.number *= change.value;
				break;
			case MODE.ADD:
				term.number += change.value;
				break;
			case MODE.DOWNGRADE:
				break;
			case MODE.UPGRADE:
				break;
		}
	}

	/* -------------------------------------------- */
	/*  Utility                                     */
	/* -------------------------------------------- */

	static validateCondition(term, condition) {
		console.groupCollapsed('validateCondition');
		console.log(condition, term);
		const cond = condition; //Object.keys(condition);
		const options = term.options ?? {};
		console.log(cond, options);
		console.groupEnd();
		for (const key of ['flavor', 'data', 'source']) {
			console.log(`${cond[key]} != ${options[key]}`);
			if ( Boolean(cond[key]) && cond[key] != options[key] ) return false;
			// if ( cond[key] && options[key] && cond[key] != options[key] ) return false;
		}
		return true;
			
		if ( condition.flavor && condition.flavor != term.options?.flavor ) return false;
		if ( condition.data && condition.data != term.options?.data ) return false;
		if ( condition.source && condition.source != term.options?.source ) return false;
		return true;
	}

	static validateTermType(term, types) {
		if ( types.length == 0 ) return true;
		if ( !types.some( t => term instanceof t) ) return false;
		return true;
	}

}