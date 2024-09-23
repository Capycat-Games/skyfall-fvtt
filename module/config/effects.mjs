/**
 * Duração pode ser condicional, evento ['turnStart','turnEnd','restStart','restEnd']
 */

let _protectedGroup = ["all", "physical", "mental", "str", "dex", "con", "int", "wis", "cha"];
export const protectedGroup = _protectedGroup.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.CONDITIONS.PROTECTEDGROUP.${key.toUpperCase()}`,
	}
	return obj;
}, {});


let _durations = ["turn", "round", "scene", "minute", "hour", "day", "month", "year", "until", "perm", "inst", "spec"];
export const durations = _durations.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.DURATIONS.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _events = [
	"discharge",
	"turnStart", "turnEnd",
	"roundStart", "roundEnd",
	"restStart", "restEnd", 
	"shortRestStart", "shortRestEnd",
	"longRestStart", "longRestEnd"
];
export const events = _events.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL2.EVENT.${key.capitalize()}`,
		prop: `SKYFALL2.DURATION.Until${key.capitalize()}`,
	}
	return obj;
}, {});

export const movementUnits = {
  m: "SKYFALL.ITEM.RANGES.M",
  km: "SKYFALL.ITEM.RANGES.KM",
  ft: "SKYFALL.ITEM.RANGES.FT",
  mi: "SKYFALL.ITEM.RANGES.MI",
};

let _ranges = ["self", "touch", "m", "km", "ft", "mi", "spec", "any"];
export const ranges = _ranges.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.RANGES.${key.toUpperCase()}`,
	}
	return obj;
}, {});


let _activations = ["action","bonus","free","reaction","passive","special","minute","hour","day"];
export const activations = _activations.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.ACTIVATIONS.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _areaTargets = ["radius", "sphere", "cylinder", "cone", "square", "cube", "line", "wall"];
_areaTargets = {radius: "circle", sphere: "circle", cylinder: "circle", cone: "cone", square: "rect", cube: "rect", line: "line", wall: "rect"}
export const areaTargets = Object.entries(_areaTargets).reduce((acc, key) => {
	acc[key[0]] = {
		id: key[0],
		t: key[1],
		label: `SKYFALL.ITEM.TARGETS.${key[0].toUpperCase()}`,
	}
	return acc;
}, {});

let _individualTargets = ["self", "ally", "enemy", "creature", "object", "space", "creatureOrObject", "any", "willing"];
export const individualTargets = _individualTargets.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.TARGETS.${key.toUpperCase()}`,
	}
	return obj;
}, {});