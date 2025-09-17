
// export default UTILS = {}

// UTILS.keyPairObject =
export function keyPairObject(source, key) {
	return Object.keys(source).reduce((acc, i) => {
		acc[i] = source[i][key] ?? null;
		return acc;
	}, {});
}

export function filterObject(source, keys, onlyKeys = false) {
	const filtered = {};
	for (const [key, value] of Object.entries(source)) {
		if ( onlyKeys && keys.includes(key) ) filtered[key] = value;
		else if ( !onlyKeys && !keys.includes(key) ) filtered[key] = value;
	}
	return filtered;
}

export function referenceTag(key, tagName = "span") {
	const descriptor = SYSTEM.DESCRIPTORS[key] ?? SYSTEM.GUILDDESCRIPTORS[key] ?? SYSTEM.SIGILDESCRIPTORS[key] ?? null;
	const statusEffect = SYSTEM.statusEffects[key];
	if ( !descriptor && !statusEffect ) return "";
	const reference = descriptor ?? statusEffect;
	const tag = document.createElement(tagName);
	if ( descriptor ) tag.classList.add( "skyfall-reference", "flex0", "descriptor", "descriptor-reference" );
	if ( statusEffect ) tag.classList.add( "skyfall-reference", "flex0", "statusEffect", "condition-reference" );
	tag.innerText = game.i18n.localize(reference.label ?? reference.name);
	tag.dataset.tooltip = game.i18n.localize(reference.tooltip ?? reference.hint);
	return tag.outerHTML;
}

export function format(stringId, data={}) {
	for (const [key, value] of Object.entries(data)) {
		data[key].value = game.i18n.localize(value);
	}
	return game.i18n.format(stringId, data);
}


export const descriptorsTags = (descriptors, options = {}) => {
	const list = options.sigil ? SYSTEM.SIGILDESCRIPTORS : SYSTEM.DESCRIPTORS;
	return descriptors.reduce((acc, key) => {
		if ( options.type && list[key]?.type.includes(type) ) return acc;
		acc[key] = {
			value: ( descriptors.includes(key) ),
			...list[key] ?? {
				id: key, hint: "", type: "origin", label: key.toUpperCase(),
			}
		}
		return acc;
	}, {});
}

export function rollTitle(config){
	const ability = SYSTEM.abilities[config.ability];
	const skill = SYSTEM.skills[config.skill];
	const types = {
		initiative: game.i18n.localize("SKYFALL2.Initiative"),
		attack: game.i18n.localize("SKYFALL2.Attack"),
		death: game.i18n.localize("SKYFALL2.Death"),
	}
	switch (config.type) {
		case "check":
			return game.i18n.localize("SKYFALL2.APP.ROLLCONFIG.Check");
		case "ability":
			return game.i18n.format("SKYFALL2.APP.ROLLCONFIG.Check", {
				type: game.i18n.localize(ability?.label) ?? '-',
			});
		case "skill":
			return game.i18n.format("SKYFALL2.APP.ROLLCONFIG.CheckAbility", {
				type: game.i18n.localize(skill.label) ?? '-',
				ability: game.i18n.localize(ability?.label) ?? '-',
			});
		case "initiative":
		case "attack":
			return game.i18n.format("SKYFALL2.APP.ROLLCONFIG.CheckAbility", {
				type: types[config.type],
				ability: game.i18n.localize(ability?.abbr) ?? "-",
			});
		case "deathsave":
			return game.i18n.format("SKYFALL2.APP.ROLLCONFIG.Check", {
				type: game.i18n.localize("SKYFALL2.Death")
			});
		case "damage":
			return game.i18n.format("SKYFALL2.APP.ROLLCONFIG.DamageRoll", {
				formula: config.formula
			});
		case "catharsis":
			return game.i18n.localize("SKYFALL2.APP.ROLLCONFIG.CatharsisRoll");
		default:
			return "";
	}
}


export function createHTMLElement({tag, cssClasses=[], content, value}){
	const dom = document.createElement(tag);
	cssClasses.map( cls => dom.classList.add( cls ) );
	
	if ( content && content instanceof HTMLElement) dom.html = content;
	else if ( content ) {
		dom.innerText = content;
	}
	if ( value ) dom.value = value;
	return dom;
}
