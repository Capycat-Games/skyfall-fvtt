
export function widgetDescriptors(field, _groupConfig, inputConfig){
	// Create the form field
	const fg = document.createElement("div");
	fg.className = "form-group stacked descriptors";
	const ff = fg.appendChild(document.createElement("div"));
	ff.className = "form-fields";
	// fg.insertAdjacentHTML("afterbegin", `<>${game.i18n.localize("SKYFALL.ITEM.DESCRIPTORS")}</h3>`);
	const input = foundry.applications.fields.createTextInput({
		name: "_descriptor" ,//field.fieldPath,
		value: '',
		blank: "",
		class: ['field-tag']
	});
	ff.appendChild(input);
	
	// Create the Descriptor list
	const descriptorsList = document.createElement("div");
	descriptorsList.className = 'tags-options flexrow';
	const descriptorsChosen = document.createElement("div");
	descriptorsChosen.className = 'chosen-tags flexrow';
	for (const [key, tag] of Object.entries(inputConfig.descriptors)) {
		const dff = document.createElement("div");
		dff.className = 'form-fields';
		const label = document.createElement("label");
		label.innerHTML = tag.label;
		label.classList = 'descriptor ' + (tag.value ? 'active' : '')
		if ( tag.value ) descriptorsChosen.appendChild(dff);
		
		const checkbox = foundry.applications.fields.createCheckboxInput({
			name: field.fieldPath, //'system.descriptors',
			value: key,
			blank: "",
			class: ['field-tag']
		});
		label.appendChild(checkbox);
		descriptorsList.appendChild(dff);
	}
	ff.appendChild(descriptorsList);
	ff.appendChild(descriptorsChosen);

	return fg;
}

export function characterChoiceWidget(field, _groupConfig, inputConfig) {

	// Create the form field
	const fg = document.createElement("div");
	fg.className = "form-group stacked character";
	const ff = fg.appendChild(document.createElement("div"));
	ff.className = "form-fields";
	fg.insertAdjacentHTML("beforeend", `<p class="hint">${field.hint}</p>`);

	// Actor select
	const others = game.users.reduce((s, u) => {
		if ( u.character && !u.isSelf ) s.add(u.character.id);
		return s;
	}, new Set());

	const options = [];
	const ownerGroup = game.i18n.localize("OWNERSHIP.OWNER");
	const observerGroup = game.i18n.localize("OWNERSHIP.OBSERVER");
	for ( const actor of game.actors ) {
		if ( !actor.testUserPermission(this.document, "OBSERVER") ) continue;
		const a = {value: actor.id, label: actor.name, disabled: others.has(actor.id)};
		options.push({group: actor.isOwner ? ownerGroup : observerGroup, ...a});
	}

	const input = foundry.applications.fields.createSelectInput({
		name: field.fieldPath,
		options,
		value: inputConfig.value,
		blank: "",
		sort: true
	});
	ff.appendChild(input);

	// Player character
	const c = this.document.character;
	if ( c ) {
		ff.insertAdjacentHTML("afterbegin", `<img class="avatar" src="${c.img}" alt="${c.name}">`);
		const release = `<button type="button" class="icon fa-solid fa-ban" data-action="releaseCharacter" 
														 data-tooltip="USER.SHEET.BUTTONS.RELEASE"></button>`
		ff.insertAdjacentHTML("beforeend", release);
	}
	return fg;
}