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

export const rollTitle = (config) => {
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


export const createHTMLElement = ({tag, cssClasses=[], content, value}) => {
	const dom = document.createElement(tag);
	cssClasses.map( cls => dom.classList.add( cls ) );
	
	if ( content && content instanceof HTMLElement) dom.html = content;
	else if ( content ) {
		dom.innerText = content;
	}
	if ( value ) dom.value = value;
	return dom;
}

export const keyPairObject = (source, key) => {
	const data = {};
	for (const [k, v] of Object.entries(source)) {
		data[k] = v[key] ?? null;
	}
	return data;
}

/*
// Prepare descriptor structure {id, type, label, hint, value}
if ( this.descriptors ) {
	const _descriptors = [ ...this.descriptors ];
	this._labels.descriptors = _descriptors.reduce((acc, key) => {
		acc[key] = {
			value: (this.descriptors.includes(key)),
			...SYSTEM.DESCRIPTORS[key] ?? {
				id: key, hint: "", type: "origin", label: key.toUpperCase(),
			}
		}
		return acc;
	}, {});
}

const _descriptors = [ ...context.system.descriptors , ...Object.keys(SYSTEM.DESCRIPTORS) ];
context.descriptors = _descriptors.reduce((acc, key) => {
	if ( type && !SYSTEM.DESCRIPTORS[key]?.type.includes(type) ) return acc;
	acc[key] = {
		value: (context.system.descriptors.includes(key)),
		...SYSTEM.DESCRIPTORS[key] ?? {
			id: key, hint: "", type: "origin", label: key.toUpperCase(),
		}
	}
	return acc;
}, {});

const _descriptors = [ ...context.system.apply.descriptors , ...Object.keys(SYSTEM.DESCRIPTORS) ];
context.descriptors = _descriptors.reduce((acc, key) => {
	if ( type && !SYSTEM.DESCRIPTORS[key]?.type.includes(type) ) return acc;
	acc[key] = {
		value: (context.system.apply.descriptors.includes(key)),
		...SYSTEM.DESCRIPTORS[key] ?? {
			id: key, hint: "", type: "origin", label: key.toUpperCase(),
		}
	}
	return acc;
}, {});
*/