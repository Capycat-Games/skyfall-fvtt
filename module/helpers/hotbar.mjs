
async function createMacro(data, slot){
	let macro = game.macros.find(
		(m) => m.name === data.name && m.command === data.command
	);
	if ( !macro ) {
		macro = await Macro.create({
			...data,
			type: 'script',
		});
	}
	game.user.assignHotbarMacro(macro, slot);
}

export async function abilityUse(data, slot) {
	const ability = data.ability ? await Item.fromDropData(data.ability) : null;
	const item = data.item ? await Item.fromDropData(data.item) : null;
	if ( !item && !ability ) return;
	const macroData = {};
	macroData.name = item? item.name : ability.name;
	macroData.img = item? item.img : ability.img;
	macroData.command = `skyfall.documents.SkyfallItem.abilityUse(
		event,
		"${ability ? ability.uuid : ''}",
		"${item ? item.uuid : ''}",
	);`;
	
	return createMacro(macroData, slot)
}
