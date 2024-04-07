/**
 * Duração pode ser condicional, evento ['turnStart','turnEnd','restStart','restEnd']
 */


let _durations = ["turn", "round", "scene", "minute", "hour", "day", "month", "year", "until", "perm", "inst", "spec"];
export const durations = _durations.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.DURATIONS.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let events = ["turnStart","turnEnd","roundStart","roundEnd","shortRestStart","shortRestEnd","restStart","restEnd"];

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


let _activations = ["action","bonus","free","reaction","special","minute","hour","day"];
export const activations = _activations.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.ACTIVATIONS.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _areaTargets = ["radius", "sphere", "cylinder", "cone", "square", "cube", "line", "wall"];
//["cone", "cubo", "cilindro", "esfera", "linha"];
export const areaTargets = _areaTargets.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.TARGETS.${key.toUpperCase()}`,
	}
	return obj;
}, {});

let _individualTargets = ["self", "ally", "enemy", "creature", "object", "space", "creatureOrObject", "any", "willing"];
export const individualTargets = _individualTargets.reduce((obj, key) => {
	obj[key] = {
		id: key,
		label: `SKYFALL.ITEM.TARGETS.${key.toUpperCase()}`,
	}
	return obj;
}, {});