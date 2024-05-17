import SkyfallItemSheet from "./item.mjs";

export default class SkyfallAbilitySheet extends SkyfallItemSheet {
	static get defaultOptions() {
		return Object.assign(super.defaultOptions, {
			width: 'auto',
			height: 'auto',
		})
	};
}