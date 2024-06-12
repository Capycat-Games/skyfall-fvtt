const _terms = foundry.dice.terms;
/**
 * A type of roll specific to Skyfall RPG
 * TODOS:
 * - TAGS. A way of identify a roll and retrieve applicable modifiers.
 * @TAG check                            A D20 Roll
 * @TAG ability, skill, attack           Check context
 * @TAG damage                           Damage Roll
 * @TAG catharsis                        A d6 added to a fulfilled roll
 */

export default class SkyfallRoll extends Roll {

	async applyCatharsis({operator = '+'}){
		if ( this.evaluated ) return; //TODO NOTICE
		const catharsis = new Roll(`1d6[catharsis${operator}]`);
		await catharsis.evaluate();
		const catTerm = this.terms.find( t => t.flavor == `catharsis${operator}` );
		if ( catTerm ){
			catTerm.number = catTerm.number + 1;
			catTerm.results = catTerm.results.concat( catharsis.terms[0].results );
		} else {
			this.terms = this.terms.concat([
				new _terms.OperatorTerm({operator: operator}),
				catharsis.terms[0]
			]);
		}
		this._formula = this.resetFormula(this.terms);
		this._formula = this._formula.replaceAll(/(\[\w*(\+|\-)?\])/g, '');
		try {
			if ( game.dice3d ) game.dice3d.renderRolls( {}, [ catharsis ])
		} catch (error) {
			
		}
		return this._evaluate();
	}
}