/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	return loadTemplates([
		// Actor partials.
		'systems/skyfall/templates/actor/parts/ability-scores.hbs',
		'systems/skyfall/templates/actor/parts/features.hbs',
		'systems/skyfall/templates/actor/parts/actions.hbs',
		'systems/skyfall/templates/actor/parts/abilities.hbs',
		'systems/skyfall/templates/actor/parts/inventory.hbs',
		'systems/skyfall/templates/actor/parts/favorites.hbs',
		'systems/skyfall/templates/actor/parts/spells.hbs',
		'systems/skyfall/templates/actor/parts/skills.hbs',
		'systems/skyfall/templates/actor/parts/header-field.hbs',

		"systems/skyfall/templates/actor/parts/header.hbs",
		"systems/skyfall/templates/actor/parts/aside.hbs",

		// 'systems/skyfall/templates/actor/parts/actor-effects.hbs',
		// Item partials
		// 'systems/skyfall/templates/item/parts/item-effects.hbs',
		'systems/skyfall/templates/item/parts/legacy.hbs',
		'systems/skyfall/templates/item/parts/background.hbs',
		'systems/skyfall/templates/item/parts/class.hbs',
		'systems/skyfall/templates/item/parts/path.hbs',
		'systems/skyfall/templates/item/parts/equipment.hbs',
		'systems/skyfall/templates/item/parts/description.hbs',
		'systems/skyfall/templates/item/parts/description-physical.hbs',
		'systems/skyfall/templates/item/parts/items-list.hbs',

		// Shared partials
		'systems/skyfall/templates/shared/descriptor-field.hbs',
		'systems/skyfall/templates/shared/active-effects.hbs',


		"systems/skyfall/templates/apps/rest-config.hbs",
	]);
};
