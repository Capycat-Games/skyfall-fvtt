import * as CREATURES from "./creature.mjs";
import * as EFFECTS from "./effects.mjs";
import * as TYPES from "./types.mjs";
import * as CONDITIONS from "./conditions.mjs";
import * as TRANSFORMERS from "./transformers.mjs";
import * as ACTIONS from "./common-actions.mjs";
export const SYSTEM_ID = "skyfall";

const _SVGICONS = {
  // sfaction: "systems/skyfall/assets/sheet/sfaction.svg",
  // sfactive: "systems/skyfall/assets/sheet/sfactive.svg",
  // sfbonus: "systems/skyfall/assets/sheet/sfbonus.svg",
  // sfdefense: "systems/skyfall/assets/sheet/sfdefense.svg",
  // sfdr: "systems/skyfall/assets/sheet/sfdr.svg",
  // sffree: "systems/skyfall/assets/sheet/sffree.svg",
  // sfheath: "systems/skyfall/assets/sheet/sfheath.svg",
  // sfmaction: "systems/skyfall/assets/sheet/sfmaction.svg",
  // sfmod: "systems/skyfall/assets/sheet/sfmod.svg",
  // sfpassive: "systems/skyfall/assets/sheet/sfpassive.svg",
  // sfreaction: "systems/skyfall/assets/sheet/sfreaction.svg",
  // sfrepeatable: "systems/skyfall/assets/sheet/sfrepeatable.svg",
  // sfspellattack: "systems/skyfall/assets/sheet/sfspellattack.svg",
  // sfspellcontrol: "systems/skyfall/assets/sheet/sfspellcontrol.svg",
  // sfspellutil: "systems/skyfall/assets/sheet/sfspellutil.svg",

  sfmelee: "icons/svg/sword.svg",
  sfranged: "icons/svg/target.svg",
  sfsigil: "icons/svg/sun.svg",
}

const _FONTICONS = {
  sfaction: '<span class="skyfall-icon">A</span>',
  sfactive: '<span class="skyfall-icon">O</span>',
  sfbonus: '<span class="skyfall-icon">B</span>',
  sfdefense: '<span class="skyfall-icon">D</span>',
  sfdr: '<span class="skyfall-icon">F</span>',
  sffree: '<span class="skyfall-icon">L</span>',
  sfheart: '<span class="skyfall-icon">V</span>',
  sfmaction: '<span class="skyfall-icon">N</span>',
  sfmod: '<span class="skyfall-icon">M</span>',
  sfpassive: '<span class="skyfall-icon">P</span>',
  sfreaction: '<span class="skyfall-icon">R</span>',
  sfrepeatable: '<span class="skyfall-icon">T</span>',
  sfspellofensive: '<span class="skyfall-icon">J</span>',
  sfspellcontrol: '<span class="skyfall-icon">K</span>',
  sfspellutility: '<span class="skyfall-icon">H</span>',
}

const SVGICONS = {}
Object.entries(_SVGICONS).reduce((acc, ent) => {
  acc[ent[0]] = `<i class="sf-icon"><svg><image href="${ent[1]}"/></svg></i>`
  return acc;
}, SVGICONS);

const SHEETICONS = {
  search: '<i class="fa-solid fa-magnifying-glass"></i>',
  edit: '<i class="fa-solid fa-pen-to-square"></i>',
  delete: '<i class="fa-solid fa-trash"></i>',
  create: '<i class="fa-solid fa-plus"></i>',
  gear: '<i class="fa-solid fa-gear"></i>',
  xmark: '<i class="fa-solid fa-xmark"></i>',
  on: '<i class="fa-solid fa-toggle-on"></i>',
  off: '<i class="fa-solid fa-toggle-off"></i>',
  check: '<i class="fa-solid fa-check"></i>',
  checkdouble: '<i class="fa-solid fa-check-double"></i>',
  star: '<i class="fa-regular fa-star"></i>',
  starfill: '<i class="fa-solid fa-star"></i>',
  square: '<i class="fa-regular fa-square"></i>',
  squarefill: '<i class="fa-solid fa-square"></i>',
  heart: '<i class="fa-solid fa-square"></i>',
  heartline: '<i class="fa-solid fa-heart-pulse"></i>',
  heartcrack: '<i class="fa-solid fa-heart-crack"></i>',
  skull: '<i class="fa-solid fa-skull"></i>',
  shield: '<i class="fa-solid fa-shield"></i>',
  shieldhalf: '<i class="fa-solid fa-shield-halved"></i>',
  food: '<i class="fa-solid fa-utensils"></i>',
  tent: '<i class="fa-solid fa-campground"></i>',
  bed: '<i class="fa-solid fa-bed"></i>',
  gem: '<i class="fa-solid fa-gem"></i>',
  coin: '<i class="fa-regular fa-star"></i>',
  chat: '<i class="fa-solid fa-message"></i>',
  walk: '<i class="fa-solid fa-person-walking"></i>',
  flight: '<i class="fa-solid fa-dove"></i>',
  swim: '<i class="fa-solid fa-person-swimming"></i>',
  climb: '<i class="fa-solid fa-person-falling"></i>',
  dig: '<i class="fa-solid fa-person-digging"></i>',
  // TODO
  ...SVGICONS,
  ..._FONTICONS,
  
  skaction: '<i class="fa-solid fa-forward"></i>',
  skbonus: '<i class="fa-solid fa-angles-right"></i>',
  skfree: '<i class="fa-solid fa-angles-right"></i>',
  skreaction: '<i class="fa-solid fa-reply"></i>',
  skmaction: '<i class="fa-solid fa-recycle"></i>',
  skcostscale: '<i class="fa-solid fa-rotate"></i>',
  skmod: '<i class="fa-solid fa-caret-right"></i>',
}

/**
 * Include all constant definitions within the SYSTEM global export
 * @type {Object}
 */
const conditions = {};
CONDITIONS.statusEffects.reduce((acc,ef) => {
  acc[ef.id] = ef;
  return acc;
}, conditions);
export const SYSTEM = {
  id: SYSTEM_ID,
  ...CREATURES,
  ...EFFECTS,
  ...TYPES,
  actions: ACTIONS.actions,
  rollTransformers: TRANSFORMERS.rollTransformers,
  statusEffects: CONDITIONS.statusEffects,
  conditions: conditions,
  icons: SHEETICONS
};