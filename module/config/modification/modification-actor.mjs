import SkyfallRoll from "../../dice/skyfall-roll.mjs";
const rollTerms = foundry.dice.terms;
const MODE = CONST.ACTIVE_EFFECT_MODES;

export default class ActorModification {

	static get isValidModification () {
		return [
			'actor',
		];
	}
	
	/* -------------------------------------------- */
	/*  Actor Modifiers                             */
	/* -------------------------------------------- */

	static callApplyActor(actor, changes){
		for (const change of changes) {
			if ( change.type != 'actor' ) continue;
			console.groupCollapsed('callApplyActor');
			try {
				// const [handler, key] = change.key.split('_');
				if (change.key.startsWith('?')) continue;
				// if ( !ActorModification.isValidModification.includes(handler) ) continue;
				// change.key = key;
				// change.handler = handler;
				change.condition = new SkyfallRoll(change.key.replace(/\w+/,'1d6')).terms[0].options ?? {};
				change.value = SkyfallRoll.replaceFormulaData(change.value, {
					...actor.getRollData(),
				});
				console.log(actor, change);
				this.apply(actor, changes);
				
			} catch (error) {
				console.groupEnd();
				console.log(actor);
				console.log(change);
				console.error(error);
			}
			console.groupEnd();
		}
	}
	

	static apply(actor, change){
		switch (change.fn.name) {
			case 'TODO':
			case 'TODO':
				change.fn.call(this, actor, change);
				break;
			default:
				let field;
				if ( change.key.startsWith("system.") ) {
					if ( actor.system instanceof foundry.abstract.DataModel ) {
						field = actor.system.schema.getField(change.key.slice(7));
					}
				} else field = actor.schema.getField(change.key);
				if ( field ) {
					ActiveEffect.applyField(actor, change, field);
				}
				break;
		}
	}
}