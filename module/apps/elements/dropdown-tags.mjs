import { SYSTEM } from "../../config/system.mjs";

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
		this._initializeDocument();
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

	/**
	 * Predefined <option> and <optgroup> elements which were defined in the original HTML.
	 * @type {(HTMLOptionElement|HTMLOptGroupElement)[]}
	 * @protected
	 */
	_options;
	
	/**
	 * An object which maps option values to displayed labels.
	 * @type {Object<string, string>}
	 * @protected
	 */
	_choices = {};
	
	/**
	 * The button element to add a new tag.
	 * @type {HTMLButtonElement}
	 */
	#button;

	/**
	 * The input element to enter a new tag.
	 * @type {HTMLInputElement}
	 */
	#input;

	/**
	 * The tags list of assigned tags.
	 * @type {HTMLDivElement}
	 */
	#tags;

	/**
	 * The list of predefined tags.
	 * @type {HTMLDivElement}
	 */
	#checkboxes;

	/* -------------------------------------------- */

	/**
	 * Load document
	 * @protected
	 */
	_initializeDocument(){
		if (this.dataset.document) {
			this.object = fromUuidSync(this.dataset.document);
		}
	}

	/**
	 * Preserve existing <option> and <optgroup> elements which are defined in the original HTML.
	 * @protected
	 */
	_initializeOptions() {
		this._options = [...this.children];
		this._choices = {};
		for ( const option of this.querySelectorAll("option") ) {
			if ( !option.value ) continue; // Skip predefined options which are already blank
			this._choices[option.value] = option.innerText;
			if ( option.selected ) {
				this._value.add(option.value);
				option.selected = false;
			}
		}
	}
	
	_initializeTags() {}

	_initializeDDTags() {
		const initial = this.getAttribute("value") || "";
		const tags = initial ? initial.split(",") : [];
		for ( let tag of tags ) {
			tag = tag.trim();
			if ( tag ) {
				try {
					this._validateTag(tag);
				} catch ( err ) {
					console.warn(err.message);
					continue;
				}
				this._value.add(tag);
			}
		}
		this.innerText = "";
		this.removeAttribute("value");
	}
	
	/* -------------------------------------------- */

	/**
	 * Subclasses may impose more strict validation on what tags are allowed.
	 * @param {string} tag      A candidate tag
	 * @throws {Error}          An error if the candidate tag is not allowed
	 * @protected
	 */
	_validateTag(tag) {
		if ( typeof tag === "string" && tag ) return true;
		else return false;
	}

	/* -------------------------------------------- */
	
	/** @override */
	_buildElements() {
		
		const [tags, input, button] = super._buildElements();
		this.#tags = tags;
		this.#input = input;
		this.#button = button;
		// create dropdown with choices
		this.#checkboxes = document.createElement('div');
		this.#checkboxes.classList.add('tags-dropdown');
		this.#checkboxes.classList.add('scrollable');

		const children = [];
		for ( const option of this._options ) {
			if ( option instanceof HTMLOptGroupElement ) children.push(this.#buildGroup(option));
			else children.push(this.#buildOption(option));
		}
		this.#checkboxes.replaceChildren(...children);
		return [this.#input, this.#button, this.#tags, this.#checkboxes];
	}

	/* -------------------------------------------- */

	/**
	 * Translate an input <optgroup> element into a <fieldset> of checkboxes.
	 * @param {HTMLOptGroupElement} optgroup    The originally configured optgroup
	 * @returns {HTMLFieldSetElement}           The created fieldset grouping
	 */
	#buildGroup(optgroup) {

		// Create fieldset group
		const group = document.createElement("fieldset");
		group.classList.add("checkbox-group");
		const legend = document.createElement("legend");
		legend.innerText = optgroup.label;
		group.append(legend);

		// Add child options
		for ( const option of optgroup.children ) {
			if ( option instanceof HTMLOptionElement ) {
				group.append(this.#buildOption(option));
			}
		}
		return group;
	}

	/* -------------------------------------------- */

	/**
	 * Build an input <option> element into a <label class="checkbox"> element.
	 * @param {HTMLOptionElement} option      The originally configured option
	 * @returns {HTMLLabelElement}            The created labeled checkbox element
	 */
	#buildOption(option) {
		const label = document.createElement("label");
		label.classList.add("checkbox");
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = option.value;
		checkbox.checked = this._value.has(option.value);
		checkbox.disabled = this.disabled;
		label.append(checkbox, option.innerText);
		// this.#checkboxes.push(checkbox);
		
		return label;
	}

	/* -------------------------------------------- */

	/** @override */
	_refresh() {
		const reload = foundry.utils.getProperty(this.object, 'system.reload');
		const damage = foundry.utils.getProperty(this.object, 'system.damage');
		const tags = this.value.map((tag) => {
			const label = this.querySelector(`input[value="${tag}"]`)?.closest('label')?.innerText ?? tag;
			let labelData = '';
			if (tag == 'reload' && reload) {
				// labelData.qty = reload.quantity;
				// labelData.actions = reload.actions;
				const qty = reload.quantity;
				const icon = {action: 'A', bonus: 'B', free: 'L'};
				const icons = reload.actions.map( i => icon[i]).join(' + ');
				labelData = ` (${qty} ${icons})`;
			}
			if (tag == 'versatile' && damage) {
				labelData = ` (${damage.versatile.toLowerCase()})`;
			}
			return this.constructor.renderTag(tag, label, labelData, this.editable)
		});
		this.#tags.replaceChildren(...tags);
	}

	/* -------------------------------------------- */

	/**
	 * Render the tagged string as an HTML element.
	 * @param {string} tag        The raw tag value
	 * @param {string} [label]    An optional tag label
	 * @param {boolean} [editable=true]  Is the tag editable?
	 * @returns {HTMLDivElement}  A rendered HTML element for the tag
	 */
	static renderTag(tag, label, labelData, editable=true) {
		const div = document.createElement("div");
		div.className = "tag";
		div.dataset.key = tag;
		const span = document.createElement("span");
		span.textContent = label ?? tag;
		if (tag == 'reload') {
			const data = document.createElement("span");
			data.className = "skyfall-icon";
			data.textContent = labelData;
			span.append(data);
		}
		if (tag == 'versatile') {
			const data = document.createElement("span");
			data.textContent = labelData;
			span.append(data);
		}
		div.append(span);
		if ( editable ) {
			const t = game.i18n.localize(this.labels.remove);
			const a = `<a class="remove ${this.icons.remove}" data-tooltip="${t}" aria-label="${t}"></a>`;
			div.insertAdjacentHTML("beforeend", a);
		}
		return div;
	}

	/* -------------------------------------------- */

	/** @override */
	_activateListeners() {
		this.#button.addEventListener("click", this.#addTag.bind(this));
		this.#tags.addEventListener("click", this.#onClickTag.bind(this));
		this.#input.addEventListener("keydown", this.#onKeydown.bind(this));
		this.#checkboxes.addEventListener("click", this.#onClickDD.bind(this));
		for (const checkbox of this.#checkboxes.querySelectorAll('label')) {
			checkbox.addEventListener("mousedown", this.#onChangeCheckbox.bind(this));
		}
		this.#input.addEventListener("focusin", this.#onFocusInput.bind(this));
		this.#input.addEventListener("focusout", this.#onFocusInput.bind(this));
	}

	/* -------------------------------------------- */
	#onClickDD(event) {
		event.preventDefault();
		event.stopPropagation();
	}
	
	#onChangeCheckbox(event) {
		event.preventDefault();
		event.stopPropagation();
		const label = event.target;
		const check = label.querySelector('input');
		if( !this._value.has(check.value) ) return this.#addTag(check.value);
		// Delete if exists
		this._value.delete(check.value)
		this.dispatchEvent(new Event("change", {bubbles: true}));
		return this._refresh();
	}
	#onFocusInput(event) {
		if ( event.type == 'focusin' ) {
			this.#checkboxes.classList.add('active');
		} else if ( event.type == 'focusout' ) {
			this.#checkboxes.classList.remove('active');
		}
		// this._refresh();
	}

	/**
	 * Remove a tag from the set when its removal button is clicked.
	 * @param {PointerEvent} event
	 */
	#onClickTag(event) {
		if ( !event.target.classList.contains("remove") ) return;
		const tag = event.target.closest(".tag");
		this._value.delete(tag.dataset.key);
		this.dispatchEvent(new Event("change", {bubbles: true}));
		this._refresh();
	}

	/* -------------------------------------------- */

	/**
	 * Add a tag to the set when the ENTER key is pressed in the text input.
	 * @param {KeyboardEvent} event
	 */
	#onKeydown(event) {
		if ( event.key !== "Enter" ) return;
		event.preventDefault();
		event.stopPropagation();
		this.#addTag();
	}

	/* -------------------------------------------- */

	/**
	 * Add a new tag to the set upon user input.
	 */
	#addTag(value = null) {
		const tag = ( typeof value === "string" && value ? value : this.#input.value);
		
		// Validate the proposed code
		try {
			this._validateTag(tag);
		} catch(err) {
			ui.notifications.error(err.message);
			this.#input.value = "";
			return;
		}

		// Ensure uniqueness
		if ( this._value.has(tag) ) {
			ui.notifications.error(`Tag "${tag}" is already set".`);
			this.#input.value = "";
			return;
		}

		// Add hex
		this._value.add(tag.toLowerCase());
		this.#input.value = "";
		this.dispatchEvent(new Event("change", {bubbles: true}));
		this._refresh();
	}

	/* -------------------------------------------- */
	/*  Form Handling                               */
	/* -------------------------------------------- */

	/** @override */
	_getValue() {
		return Array.from(this._value);
	}

	/* -------------------------------------------- */

	/** @override */
	_setValue(value) {
		this._value.clear();
		for ( const v of value ) {
			this._validateTag(v);
		}
		for ( const v of value ) this._value.add(v);
	}

	/* -------------------------------------------- */

	/** @override */
	_toggleDisabled(disabled) {
		this.#input.toggleAttribute("disabled", disabled);
		this.#button.toggleAttribute("disabled", disabled);
	}

	/* -------------------------------------------- */

	/**
	 * Create a HTMLStringTagsElement using provided configuration data.
	 * @param {FormInputConfig<string>} config
	 */
	static create(config) {
		const tags = document.createElement(this.tagName);
		tags.name = config.name;
		const value = Array.from(config.value || []).join(",");
		tags.setAttribute("value", value);
		foundry.applications.fields.setInputAttributes(tags, config);
		return tags;
	}
}
