// let _weapons = ["simpleM", "simpleR", "martialM", "martialR", "regionalM", "regionalR", "fire", "natural", "improv"];
let _weapons = ["simple", "martial", "regional", "fire", "natural", "improv"];
export const weapons = _weapons.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.WEAPONTYPES.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _armors = ["light","heavy","shield"];
export const armors = _armors.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.ARMORTYPES.${key.toUpperCase()}`,
	}
	return obj;
}, {});


let _clothings = ["head", "chest", "arms", "legs", "jewel",]; 
export const clothings = _clothings.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.CLOTHINGTYPES.${key.toUpperCase()}`,
	}
	return obj;
}, {});


let _consumables = ["potion", "ammo", "food", "poison", "synapse",]; 
export const consumables = _consumables.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL2.CONSUMABLE.${key.titleCase()}`,
	}
	return obj;
}, {});

let _poisons = ["contact", "ingested", "inhaled", "injury"]; 
export const poisons = _poisons.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.POISONTYPES.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _spells = ["cantrip", "superficial", "shallow", "deep"];
export const spells = _spells.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["spell"],
		label: `SKYFALL.SPELLLAYERS.${key.toUpperCase()}`,
	}
	return obj;
}, {});


let _components = ["vocal", "somatic", "material"];
export const spellComponents = _components.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.SPELLCOMPONENTS.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _modificationTypes = ["change", "add", "amplify"];
export const modificationTypes = _modificationTypes.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.MODIFICATION.TYPES.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _pathTypes = ['specialized','war','mystic'];
export const pathTypes = _pathTypes.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL2.PATH.${key.titleCase()}`,
	}
	return obj;
}, {});

let _creatures = ['celestial','construct','dragon','elemental','fey','beast','giant','ooze','humanoid','fiend','monstrosity','undead','plant'];
export const creatureTypes = _creatures.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL2.CREATURE.${key.titleCase()}`,
	}
	return obj;
}, {});

export const DESCRIPTOR = {
	ORIGIN: { ...spells },
	CATEGORY: {},
	EQUIPMENT: {},
	DAMAGE: {},
	DIVERSE: {},
	SIGIL: {},
};

let categoryKeys = ["attack", "weapon", "control", "ofensive", "utility"];
categoryKeys.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["category"],
		label: `SKYFALL.DESCRIPTORS.CATEGORY.${key.toUpperCase()}`,
		hint: `SKYFALL.DESCRIPTORS.CATEGORY.${key.toUpperCase()}HINT`,
	}
	return obj;
}, DESCRIPTOR.CATEGORY);

// "bludgeoning", "slashing", "piercing", 
let equipmentKeys = ["reach", "thrown", "noisy", "composite", "garish", "shooting", "double", "eficient", "light", "lethal", "mounted", "heavy", "precise", "brittle", "reload", "returning", "superior", "versatile","elixir","granade"];
equipmentKeys.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["equipment"],
		equipment: ( key == "noisy" ? "armor" : "weapon"),
		label: `SKYFALL.DESCRIPTORS.EQUIPMENT.${key.toUpperCase()}`,
		hint: `SKYFALL.DESCRIPTORS.EQUIPMENT.${key.toUpperCase()}HINT`,
	}
	return obj;
}, DESCRIPTOR.EQUIPMENT);

let damageTypes = ["acid", "bludgeoning", "slashing", "lightning", "energy", "cold", "fire", "necrotic", "piercing", "psychic", "radiant", "thunder", "poison", "mundane", "special"];
let physicalDamage = ["bludgeoning","slashing","piercing"];
let elementalDamage = ["acid","lightning","cold","fire"];
damageTypes.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: physicalDamage.includes(key) ? ["damage","equipment"] : ["damage"],
		subtype: elementalDamage.includes(key) ? 'elemental' : null,
		label: `SKYFALL2.DESCRIPTORS.${key.titleCase()}`,
		hint: `SKYFALL2.DESCRIPTORS.${key.titleCase()}Hint`,
	}
	return obj;
}, DESCRIPTOR.DAMAGE);

let diverseKeys = ["alchemy","aspect","aura","creation","heal","divine","elemental","enchantment","ilusion","inspiration","magical","fear","mount","movement","support","voice"];
diverseKeys.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["diverse"],
		label: `SKYFALL.DESCRIPTORS.DIVERSE.${key.toUpperCase()}`,
		hint: `SKYFALL.DESCRIPTORS.DIVERSE.${key.toUpperCase()}HINT`,
	}
	return obj;
}, DESCRIPTOR.DIVERSE);

export const DESCRIPTORS = Object.freeze({
	...DESCRIPTOR.ORIGIN,
	...DESCRIPTOR.CATEGORY,
	...DESCRIPTOR.EQUIPMENT,
	...DESCRIPTOR.DAMAGE,
	...DESCRIPTOR.DIVERSE
});




export const SIGILDESCRIPTOR = {
	RANK: {},
	GEAR: {},
	CLOTHING: {},
};

const sigilRanks = ["grade1","grade2","grade3","grade4"];
sigilRanks.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["sigil"],
		label: `SKYFALL.DESCRIPTORS.SIGIL.${key.titleCase()}`,
		// hint: `SKYFALL.DESCRIPTORS.SIGIL.${key.titleCase()}HINT`,
	}
	return obj;
}, SIGILDESCRIPTOR.RANK);

const sigilGears = ["weapon","armor","shield","clothing"];
sigilGears.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["sigil"],
		label: `SKYFALL.DESCRIPTORS.SIGIL.${key.titleCase()}`,
		// hint: `SKYFALL.DESCRIPTORS.SIGIL.${key.titleCase()}HINT`,
	}
	return obj;
}, SIGILDESCRIPTOR.GEAR);

let sigilKeys = ["grade1","grade2","grade3","grade4","weapon","armor","shield","clothing","head", "chest", "arms", "legs", "jewel"];
_clothings.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["sigil"],
		label: `SKYFALL.ITEM.CLOTHINGTYPES.${key.titleCase()}`,
		// hint: `SKYFALL.DESCRIPTORS.SIGIL.${key.titleCase()}HINT`,
	}
	return obj;
}, SIGILDESCRIPTOR.CLOTHING);


export const SIGILDESCRIPTORS = Object.freeze({
	...SIGILDESCRIPTOR.RANK,
	...SIGILDESCRIPTOR.GEAR,
	...SIGILDESCRIPTOR.CLOTHING,
	...SIGILDESCRIPTOR.EQUIPMENT
});


const GUILDDESCRIPTOR = {
	GUILD: {},
	ABILITIES: {}
}

GUILDDESCRIPTOR.GUILD.guild = {
	id: 'guild',
	type: ["guild"],
	label: `SKYFALL.DESCRIPTORS.GUILD.Guild`,
	hint: `SKYFALL.DESCRIPTORS.GUILD.GuildHint`,
}

const guildAbilities = ["guild","cunning","crafting","knowledge","reputation"];
guildAbilities.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["guild"],
		label: `SKYFALL.DESCRIPTORS.GUILD.${key.titleCase()}`,
		hint: `SKYFALL.DESCRIPTORS.GUILD.${key.titleCase()}Hint`,
	}
	return obj;
}, GUILDDESCRIPTOR.ABILITIES);

export const GUILDDESCRIPTORS = Object.freeze({
	...GUILDDESCRIPTOR.GUILD,
	...GUILDDESCRIPTOR.ABILITIES,
});