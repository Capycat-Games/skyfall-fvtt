import * as CREATURES from "./creature.mjs";
import * as EFFECTS from "./effects.mjs";
import * as TYPES from "./types.mjs";
import * as CONDITIONS from "./conditions.mjs";
import * as TRANSFORMERS from "./transformers.mjs";
import * as ACTIONS from "./common-actions.mjs";
export const SYSTEM_ID = "skyfall";
import * as MODIFICATION from "./modification/_module.mjs";

const _INICIALITEMS = [
  "Compendium.skyfall-core.character-creation.Item.8RxxWZAhzTZmVTjt",
  "Compendium.skyfall-core.character-creation.Item.koLsCsbHE93BO6ut",
  "Compendium.skyfall-core.character-creation.Item.CSz4IptEFOBk2GUP",
  "Compendium.skyfall-core.equipment.Item.v09yX89RwGCewCw1",
];
const ABILITYROLL = {
  name: 'ABILITYROLL',
  type: 'ability',
  system: {
      identifier: 'ability-roll',
      activation: { type: 'action' },
      range: { value: null },
      rolls: {
          "kQM3D2kuTckYenl6": {
              "label": "Teste",
              "type": "ability",
              "terms": [],
              "protection": "str"
          }
      }
  }
}

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

  // sfcunning: "systems/skyfall/assets/sheet/sfcunning.svg",
  // sfcrafting: "systems/skyfall/assets/sheet/sfcrafting.svg",
  // sfknowledge: "systems/skyfall/assets/sheet/sfknowledge.svg",
  // sfreputation: "systems/skyfall/assets/sheet/sfreputation.svg",

  // sfcatharsis: "systems/skyfall/assets/sheet/sfcatharsis.svg",
  // sfcatharsisblue: "systems/skyfall/assets/sheet/sfcatharsis-blue.svg",
  // sfcatharsiswhite: "systems/skyfall/assets/sheet/sfcatharsis-white.svg",
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
  sfcatharsis: '<span class="skyfall-icon">C</span>',

  sfcunning: '<span class="skyfall-icon">c</span>',
  sfcrafting: '<span class="skyfall-icon">p</span>',
  sfknowledge: '<span class="skyfall-icon">k</span>',
  sfreputation: '<span class="skyfall-icon">r</span>',
}

const SVGICONS = {}
Object.entries(_SVGICONS).reduce((acc, ent) => {
  acc[ent[0]] = `<i class="sf-icon"><svg><image href="${ent[1]}"/></svg></i>`
  return acc;
}, SVGICONS);

const SHEETICONS = {
  search: '<i class="fa-solid fa-magnifying-glass"></i>',
  box: '<i class="fa-solid fa-box-open"></i>',
  edit: '<i class="fa-solid fa-pen-to-square"></i>',
  delete: '<i class="fa-solid fa-trash"></i>',
  create: '<i class="fa-solid fa-plus"></i>',
  minus: '<i class="fa-solid fa-minus"></i>',
  dice: '<i class="fa-solid fa-dice"></i>',
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
  heart: '<i class="fa-solid fa-heart"></i>',
  heartline: '<i class="fa-solid fa-heart-pulse"></i>',
  heartcrack: '<i class="fa-solid fa-heart-crack"></i>',
  skull: '<i class="fa-solid fa-skull"></i>',
  shield: '<i class="fa-solid fa-shield"></i>',
  shieldhalf: '<i class="fa-solid fa-shield-halved"></i>',
  food: '<i class="fa-solid fa-utensils"></i>',
  tent: '<i class="fa-solid fa-campground"></i>',
  bed: '<i class="fa-solid fa-bed"></i>',
  gem: '<i class="fa-solid fa-gem"></i>',
  coin: '<i class="fa-solid fa-coins"></i>',
  chat: '<i class="fa-solid fa-message"></i>',
  walk: '<i class="fa-solid fa-person-walking"></i>',
  flight: '<i class="fa-solid fa-dove"></i>',
  swim: '<i class="fa-solid fa-person-swimming"></i>',
  climb: '<i class="fa-solid fa-person-falling"></i>',
  burrow: '<i class="fa-solid fa-person-digging"></i>',
  jump: '<i class="fa-solid fa-frog"></i>',
  reload: '<i class="fa-solid fa-rotate-left"></i>',
  time: '<i class="fa-regular fa-clock"></i>',
  source: '<i class="fa-solid fa-arrow-up-right-from-square"></i>',
  scene: '<i class="fa-solid fa-clapperboard"></i>',
  effect: '<i class="fa-solid fa-person-rays"></i>',
  squaretilt: '<i class="fa-regular fa-square-full fa-rotate-by" style="--fa-rotate-angle: 45deg;"></i>',

  // TODO
  ...SVGICONS,
  ..._FONTICONS,
}

//DiceCategories
const damageCategories = [
  '1d3', '1d4', '1d6', '1d8', '1d10',
  '1d12', '2d6', '2d8', '2d10', '2d12',
];

const damageTypeIcons ={
  "acid": "",
  "bludgeoning": "",
  "slashing": "",
  "lightning": "",
  "energy": "",
  "cold": "",
  "fire": "",
  "necrotic": "",
  "piercing": "",
  "psychic": "",
  "radiant": "",
  "thunder": "",
  "poison": "",
  "mundane": "",
  "special": "",
}

/**
 * Include all constant definitions within the SYSTEM global export
 * @type {Object}
 */
// const conditions = {};
// CONDITIONS.statusEffects.reduce((acc,ef) => {
//   acc[ef.id] = ef;
//   return acc;
// }, conditions);

const _SYSTEM = {
  id: SYSTEM_ID,
  ...CREATURES,
  ...EFFECTS,
  ...TYPES,
  actions: ACTIONS.actions,
  rollTransformers: TRANSFORMERS.rollTransformers,
  statusEffects: CONDITIONS.statusEffects,
  icons: SHEETICONS,
  initialItems: _INICIALITEMS,
  prototypeItems: {
    ABILITYROLL: ABILITYROLL,
  },
  damageCategories: damageCategories,
  modification: {
    actor: MODIFICATION.ActorModification,
    item: MODIFICATION.ItemModification,
    roll: MODIFICATION.RollModification,
    effect: MODIFICATION.EffectModification,
  }
};

Object.defineProperty( _SYSTEM, 'conditions', {
  get: () => {
    let conditions = {};
    CONFIG.statusEffects.reduce( (acc, ef) => {
      acc[ ef.id ] = ef;
      return acc;
    }, conditions);
    return conditions;
  }
})

export const SYSTEM = _SYSTEM;