// Configuration
import {SYSTEM} from "./module/config/system.mjs";
globalThis.SYSTEM = SYSTEM;

// Import Modules.
import * as applications from "./module/apps/_module.mjs";
import * as documents from "./module/documents/_module.mjs";
// import {fields} from "./module/data/fields/custom.mjs";
import * as fields from "./module/data/fields/_module.mjs";
import * as models from "./module/data/_module.mjs";
import * as sheets from "./module/sheets/_module.mjs";
import * as sheetsV2 from "./module/sheetsV2/_module.mjs";
import * as dice from "./module/dice/_module.mjs";
import * as elements from "./module/apps/elements/_module.mjs"
import EffectsMenu from "./module/apps/effects-menu.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './module/helpers/templates.mjs';
import { registerHandlebarsHelpers } from "./module/helpers/handlebars.mjs";
import { registerSystemSettings } from "./module/helpers/settings.mjs";
import AbilityTemplate from "./module/helpers/ability-template.mjs";
import ShortRestV2 from "./module/apps/restV2.mjs";
import TokenSkyfall from "./module/token.mjs";
import * as functions from "./module/helpers/functions.mjs";
import TestApp from "./module/apps/dialogV2-Test.mjs";
import { CombatTrackerSkyfall } from "./module/combat.mjs";
import {SkyfallHooks} from "./module/hooks/hooks.mjs";


globalThis.skyfall = {
	CONST: SYSTEM,
	applications,
	documents,
	models,
	sheets,
	data: {
		fields
	},
	canvas: {
		AbilityTemplate
	},
	wip: {
		ShortRestV2,
		TestApp
	},
	utils: functions
}
globalThis.RollSF = dice.SkyfallRoll;
globalThis.SkyfallRoll = dice.SkyfallRoll;

Hooks.once('init', function () {
	console.log(`Initializing Skyfall Game System`);
  game.system.CONST = SYSTEM;
	globalThis.skyfall = game.skyfall = Object.assign(game.system, globalThis.skyfall);

	// Register System Settings
	registerSystemSettings();
	
	// Add custom constants for configuration.
	CONFIG.SKYFALL = SYSTEM;
	CONFIG.time.roundTime = 6;
	CONFIG.ActiveEffect.legacyTransferral = false;
	CONFIG.Combat.initiative.formula = '1d20 + @dex';
	CONFIG.Combat.initiative.decimals = 2;
	
	// Define system Document classes
	CONFIG.Actor.documentClass = documents.SkyfallActor;
	CONFIG.Item.documentClass = documents.SkyfallItem;
	CONFIG.ActiveEffect.documentClass = documents.SkyfallEffect;
	CONFIG.Token.documentClass = documents.SkyfallToken;
	CONFIG.ChatMessage.documentClass = documents.SkyfallMessage;
	CONFIG.Token.objectClass = TokenSkyfall;
	CONFIG.ui.combat = CombatTrackerSkyfall;

	// DATA MODEL
	CONFIG.Actor.dataModels["character"] = models.actor.Character;
	CONFIG.Actor.dataModels["npc"] = models.actor.NPC;
	CONFIG.Actor.dataModels["guild"] = models.actor.Guild;
	CONFIG.Actor.dataModels["partner"] = models.actor.Partner;
	CONFIG.Actor.dataModels["creation"] = models.actor.Creation;
	// CONFIG.Actor.dataModels["party"] = models.actor.Party;
	
	
	CONFIG.Item.dataModels["legacy"] = models.item.Legacy;
	CONFIG.Item.dataModels["curse"] = models.item.Curse;
	CONFIG.Item.dataModels["background"] = models.item.Background;
	CONFIG.Item.dataModels["class"] = models.item.Class;
	CONFIG.Item.dataModels["path"] = models.item.Path;
	CONFIG.Item.dataModels["feature"] = models.item.Feature;
	CONFIG.Item.dataModels["feat"] = models.item.Feat;
	CONFIG.Item.dataModels["ability"] = models.item.Ability;
	CONFIG.Item.dataModels["spell"] = models.item.Spell;
	CONFIG.Item.dataModels["sigil"] = models.item.Sigil;
	CONFIG.Item.dataModels["weapon"] = models.item.Weapon;
	CONFIG.Item.dataModels["armor"] = models.item.Armor;
	CONFIG.Item.dataModels["clothing"] = models.item.Clothing;
	CONFIG.Item.dataModels["equipment"] = models.item.Equipment;
	CONFIG.Item.dataModels["consumable"] = models.item.Consumable;
	CONFIG.Item.dataModels["loot"] = models.item.Loot;

	CONFIG.Item.dataModels["seal"] = models.item.Seal;
	CONFIG.Item.dataModels["facility"] = models.item.Facility;
	CONFIG.Item.dataModels["guild-ability"] = models.item.GuildAbility;

	CONFIG.ActiveEffect.dataModels["modification"] = models.other.Modification;
	CONFIG.ChatMessage.dataModels["usage"] = models.other.UsageMessage;

	// Register Roll Extensions
	// CONFIG.Dice.rolls[0] = dice.SkyfallRoll;
	CONFIG.Dice.rolls.push(dice.SkyfallRoll);
	CONFIG.Dice.rolls.push(dice.D20Roll);
	CONFIG.Dice.rolls = [
		dice.SkyfallRoll,
		dice.D20Roll
	]
	// CONFIG.Dice.rolls[0].CHAT_TEMPLATE = 'systems/skyfall/templates/chat/roll.hbs';

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("skyfall", sheetsV2.CharacterSheetSkyfall, {
		types: ["character"], label: 'TYPES.Actor.character',
		makeDefault: true,
	});
	Actors.registerSheet("skyfall", sheetsV2.NPCSheetSkyfall, {
		types: ["npc"], label: 'TYPES.Actor.npc',
		makeDefault: true,
	});
	Actors.registerSheet("skyfall", sheetsV2.PartnerSheetSkyfall, {
		types: ["partner","creation"], label: 'TYPES.Actor.partner',
		makeDefault: true,
	});
	Actors.registerSheet("skyfall", sheetsV2.GuildSheetSkyfall, {
		types: ["guild"], label: 'TYPES.Actor.guild',
		makeDefault: true,
	});
	
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("skyfall", sheetsV2.ItemSheetSkyfall, {
		types: ['legacy','background','class','path','feature','curse','feat','weapon','armor','clothing','equipment','consumable','loot','facility','seal'],
		makeDefault: true,
	});

	Items.registerSheet("skyfall", sheetsV2.AbilitySheetSkyfall, {
		types: ['ability','spell'],
		makeDefault: true,
	});
	Items.registerSheet("skyfall", sheetsV2.SigilSheetSkyfall, {
		types: ['sigil'],
		makeDefault: true,
	});
	Items.registerSheet("skyfall", sheetsV2.GuildAbilitySheetSkyfall, {
		types: ['guild-ability'],
		makeDefault: true,
	});
	
	Messages.registerSheet('skyfall', sheets.UsageConfig, {
		types: ['usage'],
		makeDefault: true,
	});

	DocumentSheetConfig.registerSheet(ActiveEffect, "skyfall", sheets.SkyfallModificationConfig, {
		types: ['modification'],
		makeDefault :true
	});

	// Status Effects
	CONFIG.statusEffects = SYSTEM.statusEffects;
	// CONFIG.specialStatusEffects.INVISIBLE = "INVISIBLE";
	
	// Preload Handlebars templates.
	preloadHandlebarsTemplates();
	// HELPERS
	registerHandlebarsHelpers()
	// Register Fonts
	registerFonts();
	// Enrichers
	registerCustomEnrichers();
	// TODO Sockets
	// Hooks
	// SkyfallHooks();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

/**
 * Registers all fonts used by the system so that they are available in the text editor.
 */
function registerFonts() {
	let link = document.createElement('link');
	link.type = 'text/css';
	link.rel = 'stylesheet';
	link.href = 'https://use.typekit.net/coc0chb.css';
	document.head.appendChild(link);

	const path = "systems/skyfall/fonts/";
	CONFIG.fontDefinitions['SkyfallIcons'] = {
		editor: true,
		fonts: [
			{urls: [`${path}skyfall-icons.ttf`], weight:'400'}
		]
	}

	CONFIG.fontDefinitions['Skyfall'] = {
		editor: true,
		fonts: [
			{urls: [`${path}NORTHWEST-Regular.woff`], weight:'400'},
			{urls: [`${path}NORTHWEST-Light.woff`], weight:'200'},
			{urls: [`${path}NORTHWEST-Bold.woff`], weight:'700'}
		]
	}

	CONFIG.fontDefinitions['SkyfallRust'] = {
		editor: true,
		fonts: [
			{urls: [`${path}NORTHWEST-RegularRust.otf`], weight:'400'},
			{urls: [`${path}NORTHWEST-LightRust.otf`], weight:'200'},
			{urls: [`${path}NORTHWEST-BoldRust.otf`], weight:'700'}
		]
	}
}

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("i18nInit", async function () {
	
	

});

Hooks.once('ready', async function () {
	
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
	Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));

	for (const [key, desc] of Object.entries(SYSTEM.DESCRIPTORS)) {
		SYSTEM.DESCRIPTORS[key].label = game.i18n.localize( desc.label );
	}
	
	prepareSystemLocalization();
	prepareSystemStatusEffects();

	// Re-Prepare Guild Data now that all member shall have been prepared;
	game.actors.filter( i => i.type == 'guild').map( i => i.prepareData() );

	const svg = await fetchSVG("systems/skyfall/assets/skyfall-logo-h.svg");
	svg.id = "logo";
	$("#logo").replaceWith(svg);
	// $(".ui-left")[0].insertAdjacentElement('afterbegin', svg);
});

Hooks.on("renderPlayerList", (app, html, data) => {
	if ( !game.user.isGM ) return;
	html.find('li.player').each((i, player)=> {
		if($(player).hasClass('gm')) return;
		const userId = player.dataset.userId;
		const character = game.users.get(userId).character;
		if ( !character ) return;
		const catharsis = character.system.resources.catharsis.value;
		const playerName = $(player).find('.player-name').text();
		$(player).find('.player-name').text(`${playerName} (${catharsis})`);
		const btn = document.createElement("button");
		btn.innerHTML = '<i class="fa-solid fa-bahai"></i>';
		btn.className = "give-catharsis";
		btn.title =  game.i18n.localize('SKYFALL.GIVECATHARSIS');
		btn.dataset['action'] = 'catharsis';
		player.appendChild(btn);
	});
	html.on('click', '.give-catharsis', _giveCatharsis.bind(this));
});

Hooks.on("controlToken", (token, controlled) => {
	if ( controlled ) new EffectsMenu({document: token.actor}).render(true);
	else {
		foundry.applications.instances.get(EffectsMenu.DEFAULT_OPTIONS.id)?.close();
	}
});

Hooks.on("targetToken", (user, token, target) => {
	const actor = token.actor.clone();
	actor.updateSource({'ownership.default': 1 });
	actor.ownership.default = 1;
	if ( target ) new EffectsMenu({document: actor }).render(true);
	else {
		foundry.applications.instances.get(EffectsMenu.DEFAULT_OPTIONS.id)?.close();
	}
});

Hooks.on("renderActorDirectory", (app, html, data) => {
	console.log('renderActorDirectory');
	console.log(app, html, data);
	const documentList = html.find('li.directory-item.document');
	const collection = app.constructor.collection;
	for (const li of documentList) {
		const id = li.dataset.documentId;
		const doc = collection.get(id);

		const div = document.createElement('div');
		// $('<div class="document-dado">DADO</div>');
		div.innerText = 'dado';
		console.log(li);
		li.append(div);
	}
});
// Hooks.on("renderFormApplication", (app, html, data) => {
// 	console.log(app, html, data);
// 	if ( html ) html.addEventListener('.content-embed');
// });

 
/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

function _giveCatharsis(event) {
	event.preventDefault();
	const button = event.currentTarget;
	const userId = button.closest('li').dataset.userId;
	const character = game.users.get(userId).character; 
	const catharsis = character.system.resources.catharsis.value;
	Promise.all([
		character.update({"system.resources.catharsis.value": catharsis + 1}),
		ChatMessage.create({content: `${character.name} recebeu 1 Ponto de Catarse`}),
	]).then(() => ui.players.render() );
}

/**
 * Fetch an SVG element from a source.
 * @param {string} src                        Path of the SVG file to retrieve.
 * @returns {SVGElement|Promise<SVGElement>}  Promise if the element is not cached, otherwise the element directly.
 */
function fetchSVG(src) {
	return fetch(src)
		.then(b => b.text())
		.then(t => {
			const temp = document.createElement("div");
			temp.innerHTML = t;
			const svg = temp.querySelector("svg");
			return svg;
		});
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
	// First, determine if this is a valid owned item.
	if (data.type !== 'Item') return;
	if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
		return ui.notifications.warn(
			'You can only create macro buttons for owned Items'
		);
	}
	// If it is, retrieve it based on the uuid.
	const item = await Item.fromDropData(data);

	// Create the macro command using the uuid.
	const command = `game.skyfall.rollItemMacro("${data.uuid}");`;
	let macro = game.macros.find(
		(m) => m.name === item.name && m.command === command
	);
	if (!macro) {
		macro = await Macro.create({
			name: item.name,
			type: 'script',
			img: item.img,
			command: command,
			flags: { 'skyfall.itemMacro': true },
		});
	}
	game.user.assignHotbarMacro(macro, slot);
	return false;
}

async function prepareSystemLocalization() {
	const _sys = foundry.utils.flattenObject(SYSTEM)
	const keys = Object.keys( _sys ).filter( k => k.match(/(label|abbr)$/) )
	for (const key of keys) {
		const content = foundry.utils.getProperty(SYSTEM, key);
		foundry.utils.setProperty(SYSTEM, key, game.i18n.localize(content))
	}
}

async function prepareSystemStatusEffects() {
	let journalConditions;
	if ( false && game.modules.has("skyfall-core") ) {
		journalConditions = fromUuidSync(
			"Compendium.skyfall-core.regras.JournalEntry.TBD"
		);
	} else if ( false && game.modules.has("skyfall-fastplay") ) {
		journalConditions = await fromUuid(
			"Compendium.skyfall-fastplay.regras.JournalEntry.65t2wLGXUdAgIIjm"
		);
	} else if ( true ) { //BETA
		journalConditions = await fromUuid(
			"Compendium.skyfall.rules.JournalEntry.P0sOgiGUvx9ApJPW"
		);
	}
	
	for (const [i, ef] of CONFIG.statusEffects.entries()) {
		ef.name = game.i18n.localize(ef.name);
		// Search and include tooltips
		let content = undefined;
		if ( journalConditions ) {
			let efName = ef.name.replace(/\(\w+\)/,'').trim();
			let page = journalConditions.pages.find( p => p.name == efName);
			if ( page ) {
				content = `<section class='tooltip status-effect'><h3>${efName}</h3>${page.text.content}</section>`;
			}
			ef.description = content;
		}
		ef.tooltip = content;
	}
	// SYSTEM.conditions = {};
	SYSTEM.statusEffects.reduce((acc,ef) => {
		acc[ef.id] = ef;
		return acc;
	}, SYSTEM.conditions)
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
	// Reconstruct the drop data so that we can load the item.
	const dropData = {
		type: 'Item',
		uuid: itemUuid,
	};
	// Load the item from the uuid.
	Item.fromDropData(dropData).then((item) => {
		// Determine if the item loaded and if it's an owned item.
		if (!item || !item.parent) {
			const itemName = item?.name ?? itemUuid;
			return ui.notifications.warn(
				`Could not find item ${itemName}. You may need to delete and recreate this macro.`
			);
		}

		// Trigger the item roll
		item.roll();
	});
}

function registerCustomEnrichers(){
	CONFIG.TextEditor.enrichers.push({
		pattern:
			/\[\[\/?(?<type>rr|rollrequest|damage) (?<config>[^\]]+)\]\](?:{(?<label>[^}]+)})?/gi,
		enricher: enrichRollRequest
	},{
		pattern:
			/&(?<type>Reference)\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gi,
		enricher: enrichReference
	});
	// (?<type>ability|skill|attack|damage|healing)
	document.body.addEventListener("click", rollConfig);
}

async function enrichReference(match, options) {
	let { type, config } = match.groups;
	
	let reference = SYSTEM.DESCRIPTORS[config] ?? SYSTEM.SIGILDESCRIPTORS[config] ?? SYSTEM.GUILDDESCRIPTORS[config] ?? SYSTEM.conditions[config] ?? null;
	if ( !reference ) return;
	let style;
	let tooltip = game.i18n.localize(reference.tooltip ?? reference.hint ?? reference.description);
	let label = game.i18n.localize(reference.label);
	if ( SYSTEM.DESCRIPTORS[config] || SYSTEM.SIGILDESCRIPTORS[config] || SYSTEM.GUILDDESCRIPTORS[config] ) style = "descriptor-reference";
	else if ( SYSTEM.conditions[config] ) {
		style = "condition-reference";
		const journalConditions = await fromUuid(
			"Compendium.skyfall.rules.JournalEntry.P0sOgiGUvx9ApJPW"
		);
		const page = journalConditions.pages.find( p => p.name == label );
		if ( page ) {
			tooltip = `<section class='tooltip status-effect'><h3>${label}</h3>${page.text.content}</section>`;
		}
	}
	
	const inline = document.createElement('span');
	inline.classList.add(style);
	inline.dataset.tooltip = tooltip;
	inline.innerHTML = label;
	return inline;
}

function enrichRollRequest(match, options) {
	let { type, config, label } = match.groups;
	// [[/rr type=ability ability=str]]{Força}

	config = config.replace(/:(\w+)/gi, `[$1]`);
	const rollConfigs = config.split(" ").reduce((acc, c) => {
		let cKeyVal = c.split('=');
		acc[ cKeyVal[0] ] = cKeyVal[1];
		return acc;
	}, {});
	if ( !label ) label = functions.rollTitle(rollConfigs);
	const inline = document.createElement('a');
	inline.classList.add("inline-roll-request");
	inline.classList.add("roll-config");
	inline.dataset.action = "roll-config";
	inline.dataset.type = rollConfigs.type;
	inline.dataset.ability = rollConfigs.ability;
	inline.dataset.skill = rollConfigs.skill;
	inline.dataset.formula = rollConfigs.formula;
	inline.dataset.protection = rollConfigs.protection;
	
	inline.innerHTML = `<i class="fa-solid fa-dice-d20"></i> ${label}`;
	
	return inline;
}

async function rollConfig(event){
	const target = event.target.closest('[data-action="roll-config"]');
  if ( !target ) return;
	event.stopPropagation();
	const roll = await new applications.RollConfig({
		type: target.dataset.type,
		ability: target.dataset.ability,
		skill: target.dataset.skill,
		formula: target.dataset.formula,
		protection: target.dataset.protection,
		message: target.closest(".message")?.dataset.messageId,
		createMessage: true
	}).render(true);
}