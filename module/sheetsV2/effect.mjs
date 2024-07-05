import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";
const { ItemSheetV2 } = foundry.applications.sheets;

export default class EffectSheetSkyfall extends SkyfallSheetMixin(ItemSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["skyfall", "effect"],
		position: {width: 580, height: "auto"},
		window: {
		},
		actions: {
			// heritageTab: EffectSheetSkyfall.#heritageTab,
		}
	};
}