export function SkyfallHooks(){

	/**
	 * @param change.key
	 * - 'roll#function[condition][condition]'
	 * - 'roll: {type}(function)[condition]'
	 * - 'roll :type #function ?condition '
	 */
	Hooks.on("applyActiveEffect", (actor, change, current, delta, changes) => {
		const validRolls = [
			"check",
			...Object.keys(SYSTEM.abilities).map( m => `check-${m}`),
			"initiative",
			"skill", 
			...Object.keys(SYSTEM.skills).map( m => `skill-${m}`),
			"attack", 
			"damage", 
			"deathsave", 
			"catharsis", 
			"rest", 
		];
		if ( validRolls.every( v => !change.key.startsWith(v)) ) return;
		console.groupCollapsed("applyActiveEffect");
		// const transformRE = /^(?<type>[a-z\-]+)#(?<method>[a-z\-]+)((?<params>\[.*\]))/;
		// const rt = change.key.match(transformRE);
		let type = change.key.match(/^([a-z\-]+)/g)[0];
		let method = change.key.match(/#([a-z\-]+)/g)[0];
		let params = change.key.match(/\[(.*)\]/g) ?? [];
		method = method.replace('#','');
		
		if ( !type || !method ) return;
		const rollMod = {
			type: type,
			method: method,
			value: change.value,
			source: change.effect.name,
		}
		if ( params ) {
			rollMod.conditional = params;
			rollMod.conditional2 = {
				"source": "",
				"descriptor": "",
				"target": "",
			}
		}
		const rm = foundry.utils.getProperty(actor, 'system.roll.modifiers');
		rm.push(rollMod);
		changes['system.roll.modifiers'] = rm;
		console.groupEnd();
	});
}

function findDescriptor(descriptor) {
	const DESCRIPTORS = SYSTEM.DESCRIPTORS;

}