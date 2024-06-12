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
		label: `SKYFALL.ITEM.CONSUMABLETYPES.${key.toUpperCase()}`,
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

let _pathTypes = ['spec','war','mystic'];
export const pathTypes = _pathTypes.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.PATH.TYPE${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _creatures = ["aberration", "beast", "celestial", "construct", "dragon", "elemental", "fey", "fiend", "giant", "monstrosity", "ooze", "plant"];
export const creatureTypes = _creatures.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ACTOR.TYPES.${key.toUpperCase()}`,
	}
	return obj;
}, {});

export const DESCRIPTOR = {
	ORIGIN: { ...spells },
	CATEGORY: {},
	EQUIPMENT: {},
	DAMAGE: {},
	DIVERSE: {},
};

let categoryKeys = ["attack", "weapon", "control", "ofensive", "utility"];
categoryKeys.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["category"],
		label: `SKYFALL.DESCRIPTORS.CATEGORY.${key.toUpperCase()}`,
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

let damageTypes = ["acid", "bludgeoning", "slashing", "lightning", "energy", "cold", "fire", "necrotic", "piercing", "psychic", "radiant", "thunder", "poison", "special"];
let physicalDamage = ["bludgeoning","slashing","piercing"];
let elementalDamage = ["acid","lightning","cold","fire"];
damageTypes.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: physicalDamage.includes(key) ? ["damage","equipment"] : ["damage"],
		subtype: elementalDamage.includes(key) ? 'elemental' : null,
		label: `SKYFALL.DESCRIPTORS.DAMAGE.${key.toUpperCase()}`,
		hint: `SKYFALL.DESCRIPTORS.DAMAGE.${key.toUpperCase()}HINT`,
	}
	return obj;
}, DESCRIPTOR.DAMAGE);

let diverseKeys = ["alchemy","aspect","aura","creation","heal","divine","elemental","enchantment","ilusion","inspiration","magical","fear","mount","movement","support","voice"];
diverseKeys.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: ["diverse"],
		label: `SKYFALL.DESCRIPTORS.DIVERSE.${key.toUpperCase()}`,
		hint: `SKYFALL.DESCRIPTORS.DIVERSE.${key.toUpperCase()}Hint`,
	}
	return obj;
}, DESCRIPTOR.DIVERSE);

export const DESCRIPTORS = Object.freeze({
	...DESCRIPTOR.ORIGIN,
	...DESCRIPTOR.CATEGORY,
	...DESCRIPTOR.EQUIPMENT,
	...DESCRIPTOR.DAMAGE,
	...DESCRIPTOR.DIVERSE
})




