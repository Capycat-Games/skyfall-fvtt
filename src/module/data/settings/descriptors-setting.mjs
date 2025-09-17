
export default class SkyfallDescriptors extends foundry.abstract.DataModel {
	
	static #settingName = 'descriptorConfig';
	
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		
		return {
			base: new fields.ArrayField( this.descriptorSchema(), {
				initial: this.initialDescriptors(),
				label: "SKYFALL2.DescriptorPl",
			}),
			custom: new fields.ArrayField( this.descriptorSchema(), {
				label: "SKYFALL2.CustomPl",
			}),
		}
	}

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	static descriptorSchema(){
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		return new fields.SchemaField({
			id: new fields.StringField({
				required: true,
				blank: false,
				label: "SKYFALL2.Identifier"
			}),
			label: new fields.StringField({
				required: true,
				blank: false,
				label: "SKYFALL2.Name"
			}),
			hint: new fields.StringField({
				required: true,
				blank: true,
				label: "SKYFALL2.Hint"
			}),
			type: new fields.StringField({
				required: true,
				blank: false,
				choices: {
					origin: {id: 'origin', label: "SKYFALL2.DESCRIPTOR.Origin"},
					category: {id: 'category', label: "SKYFALL2.DESCRIPTOR.Category"},
					equipment: {id: 'equipment', label: "SKYFALL2.DESCRIPTOR.Equipment"},
					damage: {id: 'damage', label: "SKYFALL2.DESCRIPTOR.Damage"},
					diverse: {id: 'diverse', label: "SKYFALL2.DESCRIPTOR.Diverse"},
					spell: {id: 'spell', label: "SKYFALL2.DESCRIPTOR.Spell"},
				},
				label: "SKYFALL2.DESCRIPTOR.Category"
			}),
		});
	}

	static initialDescriptors(){
		const types = {
			origin: [
				// Legacy
				"anur", "draco", "elf", "gnome", "human", "kishin", "sanguir", "tatsunoko", "tora", "urodel", "walshie", "herculen", "petalin", "jotun", "naga", "cherub",
				// Curse
				"aetherborn", "gorgonborn", "deathborn", "shadowborn",
				// Background
				"organization-agent", "omen",
				// Class
				"combatant", "especialist", "occultist",
				// Path
				"alchemyst", "guild-artisan", "assassin", "thopter-knight", "commander", "devotee", "elementalist", "koi-warrior", "ancestral-heir", "magitechnician", "rogue", "weaponmaster", "beastmaster", "necromant", "covenanted", "warden", "boxer", "peddler",
				// FEATURE GROUP

				// OTHER
				"blessing",
				// Spell
				"cantrip", "superficial", "shallow", "deep",
			],
			category: [
				"attack", "weapon", "control", "ofensive", "utility"
			],
			equipment: [
				"reach", "thrown", "noisy", "composite", "garish", "shooting", "double", "eficient", "light", "lethal", "mounted", "heavy", "precise", "brittle", "reload", "returning", "superior", "versatile","elixir","granade"
			],
			damage: [
				"acid", "bludgeoning", "slashing", "lightning", "energy", "cold", "fire", "necrotic", "piercing", "psychic", "radiant", "thunder", "poison", "mundane", "special"
			],
			diverse: [
				"alchemy","aspect","aura","creation","heal","divine","elemental","enchantment","ilusion","inspiration","magical","fear","mount","movement","support","voice"
			],
		}
		
		const DESCRIPTORS = [];
		for (const [type, arr] of Object.entries(types) ) {
			for (const id of arr) {
				const data = {
					id: id,
					label: `SKYFALL2.DESCRIPTORS.${id.titleCase()}`,
					hint: `SKYFALL2.DESCRIPTORS.${id.titleCase()}Hint`,
					type: type,
				}
				DESCRIPTORS.push(data);
			}
		}
		return DESCRIPTORS;
	}

	/* -------------------------------------------- */
	/*  Getters & Setters                           */
	/* -------------------------------------------- */

	get descriptors() {
		const descriptors = [...this.base, ...this.custom];
		return descriptors.reduce( (acc, d) => {
			acc[d.id] = d;
			return acc;
		}, {});
	}

	get typeDescriptors() {
		const descriptors = [...this.base, ...this.custom];
		return descriptors.reduce( (acc, d) => {
			acc[d.type.titleCase()] ??= {};
			acc[d.type.titleCase()][d.id] = d;
			return acc;
		}, {});
	}
	
	/* -------------------------------------------- */
	/*  Type Methods                                */
	/* -------------------------------------------- */

	static init() {
		const setting = game.settings.get('skyfall', SkyfallDescriptors.#settingName);
		const descriptors = [...setting.base, ...setting.custom];
		
		descriptors.map( d => {
			SYSTEM.DESCRIPTOR[d.type] ??= {};
			SYSTEM.DESCRIPTOR[d.type][d.id] = d;
			SYSTEM.DESCRIPTORS[d.id] = d;
			return true;
		})
	}

	static isMundane(id) {
		const _mundane = ['bludgeoning', 'slashing', 'piercing'];
		return _mundane.includes(id);
	}

	static isElemental(id) {
		const _elemental = ['acid', 'cold', 'fire', 'lightning'];
		return _elemental.includes(id);
	}

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	
}
