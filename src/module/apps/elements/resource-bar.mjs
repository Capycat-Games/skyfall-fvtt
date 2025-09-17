
const { HTMLStringTagsElement } = foundry.applications.elements;
/**
 * A custom HTML element which allows for arbitrary assignment of a set of string tags.
 * This element may be used directly or subclassed to impose additional validation or functionality.
 * @extends {HTMLStringTagsElement<Set<string>>}
 */
export default class HTMLDropDownTagsElement extends HTMLStringTagsElement {
	constructor() {
		super();
		this._value = new Set();
		this._initializeOptions();
		this._initializeDDTags();
	}

	/** @override */
	static tagName = "dropdown-tags";

	static icons = {
		add: "fa-solid fa-plus",
		remove: "fa-solid fa-times"
	}

	static labels = {
		add: "SKYFALL.ELEMENTS.DDTAGS.ADD",
		remove: "ELEMENTS.TAGS.Remove",
		placeholder: ""
	}
}