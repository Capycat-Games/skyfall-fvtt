// for, des, con, int, sab, car
// Forca Destreza Constituicao Inteligência Sabedoria Carisma
let _abilities = ["str", "dex", "con", "int", "wis", "cha"];
export const abilities = _abilities.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ACTOR.ABILITIES.${key.toUpperCase()}`,
		abbr: `SKYFALL.ACTOR.ABILITIES.${key.toUpperCase()}ABBR`,
	}
	return obj;
}, {});

/**
 * "APRE": "Apresentacao",			"Pre": Presentation,
 * "APTI": "Aptidao",						"Apt": Aptitude,
 * "ARCA": "Arcanismo",					"Arc": Arcanum,
 * "CULT": "Cultura",						"Cul": Culture,
 * "DIPL": "Diplomacia",				"Dip": Diplomacy,
 * "DOUT": "Doutrinas",					"Doc": Doctrines,
 * "FURT": "Furtividade",				"Ste": Stealth,
 * "INTI": "Intimidacao",				"Int": Intimidation,
 * "INTU": "Intuicao",					"Ins": Insight,
 * "MAGI": "Magitec",						"Mag": Magitech,
 * "MALA": "Malandragem",				"Rog": Roguery,
 * "MANI": "Manipulacao",				"Man": Manipulation,
 * "MEDI": "Medicina",					"Med": Medicine,
 * "NATU": "Natureza",					"Nat": Nature,
 * "PERC": "Percepcao",					"Per": Perception,
 * "PREP": "Preparo Físico",		"Fit": Fitness,
 * 
 * "For" Forja									"For": Forging
 * "Ven" Veneno									"Poi": Poison
 * "Pes" Pescaria								"Fis": Fishing
 * "Alq" Alquimia								"Alc": Alchemy
 * "Des" Destilação							"Dis": Distillation
 * "Car" Cartografia						"Car": Cartography
 * "Alf" Alfaiataria						"Tai": Tailoring
 * "Cul" Culinária							"Coo": Cooking
 * "Pin" Pintura								"Pai": Painting
 * "Art" Artesanato							"Cra": Craftsmanship
 * "Nav" Navegação							"Nav": Navigation
 * "Ins" Instrumentos						"Ins": Instruments
 */
let _skills = ["pre","apt","arc","cul","dip","doc","ste","int","ins","mag","rog","man","med","nat","per","fit"];
export const skills = _skills.reduce((obj, key) => {
	obj[key] = {
		id: key,
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
