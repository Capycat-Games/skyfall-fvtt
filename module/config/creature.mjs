// for, des, con, int, sab, car
// Forca Destreza Constituicao Inteligência Sabedoria Carisma
let _abilities = ["str", "dex", "con", "int", "wis", "cha","mental","physical"];
export const abilities = _abilities.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL2.ABILITY.${key.titleCase()}`,
		abbr: `SKYFALL2.ABILITY.${key.titleCase()}Abbr`,
	}
	return obj;
}, {});

/**
 * "APRE": "Apresentacao",			"Pres": Presentation,
 * "APTI": "Aptidao",						"Apti": Aptitude,
 * "ARCA": "Arcanismo",					"Arca": Arcanum,
 * "CULT": "Cultura",						"Cult": Culture,
 * "DIPL": "Diplomacia",				"Dipl": Diplomacy,
 * "DOUT": "Doutrinas",					"Doct": Doctrines,
 * "FURT": "Furtividade",				"Stea": Stealth,
 * "INTI": "Intimidacao",				"Inti": Intimidation,
 * "INTU": "Intuicao",					"Insi": Insight,
 * "MAGI": "Magitec",						"Magi": Magitech,
 * "MALA": "Malandragem",				"Rogu": Roguery,
 * "MANI": "Manipulacao",				"Mani": Manipulation,
 * "MEDI": "Medicina",					"Medi": Medicine,
 * "NATU": "Natureza",					"Natu": Nature,
 * "PERC": "Percepcao",					"Perc": Perception,
 * "PREP": "Preparo Físico",		"Fitn": Fitness,
 * 
 * "For" Forja									"Forg": Forging
 * "Ven" Veneno									"Pois": Poison
 * "Pes" Pescaria								"Fish": Fishing
 * "Alq" Alquimia								"Alch": Alchemy
 * "Des" Destilação							"Dist": Distillation
 * "Car" Cartografia						"Cart": Cartography
 * "Alf" Alfaiataria						"Tail": Tailoring
 * "Cul" Culinária							"Cook": Cooking
 * "Pin" Pintura								"Pain": Painting
 * "Art" Artesanato							"Craf": Craftsmanship
 * "Nav" Navegação							"Navi": Navigation
 * "Ins" Instrumentos						"Inst": Instruments
 */
let _skills = ["pres","apti","forg","pois","fish","alch","dist","cart","tail","cook","pain","craf","navi","inst","arca","cult","dipl","doct","stea","inti","insi","magi","rogu","mani","medi","natu","perc","fitn"];
let _coreSkills = ["pres","apti","arca","cult","dipl","doct","stea","inti","insi","magi","rogu","mani","medi","natu","perc","fitn"];
let _aptiSkills = ["forg","pois","fish","alch","dist","cart","tail","cook","pain","craf","navi","inst"];
export const skills = _skills.reduce((obj, key) => {
	obj[key] = {
		id: key,
		type: (_coreSkills.includes(key) ? 'core' :  (_aptiSkills.includes(key) ? 'apti' : 'custom')),
		label: `SKYFALL.ACTOR.SKILLS.${key.toUpperCase()}`,
	}
	return obj;
}, {});

export const actorSizes = Object.freeze({
	tiny: {
		id: "tiny",
		label: "SKYFALL.ACTOR.SIZES.TINY",
		abbr: "SKYFALL.ACTOR.SIZES.TINYABBR",
		gridScale: 0.5,
	},
	sm: {
		id: "sm",
		label: "SKYFALL.ACTOR.SIZES.SMALL",
		abbr: "SKYFALL.ACTOR.SIZES.SMALLABBR",
		gridScale: 0.8
	},
	med: {
		id: "med",
		label: "SKYFALL.ACTOR.SIZES.MEDIUM",
		abbr: "SKYFALL.ACTOR.SIZES.MEDIUMABBR",
		gridScale: 1
	},
	lg: {
		id: "lg",
		label: "SKYFALL.ACTOR.SIZES.LARGE",
		abbr: "SKYFALL.ACTOR.SIZES.LARGEABBR",
		gridScale: 2,
	},
	huge: {
		id: "huge",
		label: "SKYFALL.ACTOR.SIZES.HUGE",
		abbr: "SKYFALL.ACTOR.SIZES.HUGEABBR",
		gridScale: 3,
	},
	grg: {
		id: "grg",
		label: "SKYFALL.ACTOR.SIZES.GARGANTUAN",
		abbr: "SKYFALL.ACTOR.SIZES.GARGANTUANABBR",
		gridScale: 4,
	}
});

let _movement = ["walk", "swim","climb", "burrow", "flight", "str", "dex"];
export const movement = _movement.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ACTOR.MOVEMENTS.${key.toUpperCase()}`,
	}
	return obj;
}, {});
let _resources = ["hp","ep","hitDie","catharsis","shadow"];
export const resources = _resources.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ACTOR.RESOURCES.${key.toUpperCase()}`,
		abbr: `SKYFALL.ACTOR.RESOURCES.${key.toUpperCase()}ABBR`,
	}
	return obj;
}, {});

export const currency = Object.freeze({
	t: {
		id: "t",
		label: "SKYFALL.CURRENCY.TROCADO",
		abbr: "SKYFALL.CURRENCY.TROCADOABBR",
	},
	p: {
		id: "p",
		label: "SKYFALL.CURRENCY.PILE",
		abbr: "SKYFALL.CURRENCY.PILEABBR",
	},
	k: {
		id: "k",
		label: "SKYFALL.CURRENCY.KURMAC",
		abbr: "SKYFALL.CURRENCY.KURMACABBR",
	},
});

let _laguages = ["common","abyssal","anuri","bo","celestial","draconic","toranio","elvish","kia","kishi","vampy"];
export const languages = _laguages.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.LANGUAGES.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _damageModifiers = ["vul", "nor", "res", "imu"];
export const damageModifiers = _damageModifiers.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ACTOR.DAMAGE.${key.toUpperCase()}`,
		abbr: `SKYFALL.ACTOR.DAMAGE.${key.toUpperCase()}ABBR`,
	}
	return obj;
}, {});


let npcHierarchy = ["simple", "complex", "boss"];
export const hierarchy = npcHierarchy.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.DM.HIERARCHYTYPES.${key.toUpperCase()}`,
		abbr: `SKYFALL.DM.HIERARCHYTYPES.${key.toUpperCase()}ABBR`,
	}
	return obj;
}, {});


let npcArchetype = ['ranged','brute','group','mount','defender','flanker','leader','sentinel'];
export const archetype = npcArchetype.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.DM.ARCHETYPETYPES.${key.toUpperCase()}`,
		abbr: `SKYFALL.DM.ARCHETYPETYPES.${key.toUpperCase()}ABBR`,
	}
	return obj;
}, {});
