
export default class RollTermsField extends foundry.data.fields.SetField {
	constructor(options={}) {
		let field = RollTermsField.#field();
		options.hidden ??= [];
		super(field, options);
	}

	static #field() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		
		const damageTypes = Object.values(
			SYSTEM.DESCRIPTORS ?? game.settings.get("skyfall", "descriptors").descriptors
		).filter( i => i.type == "damage").reduce((acc, i) => {
				acc[i.id] = i.label ?? i.name;
				return acc;
		}, {});
		damageTypes.heal = "SKYFALL.DESCRIPTORS.Heal";
		damageTypes.hptemp = "SKYFALL.DESCRIPTORS.TempHp";
		damageTypes.ep = "SKYFALL.DESCRIPTORS.Ep";
		damageTypes.eprecovery = "SKYFALL.DESCRIPTORS.EpHeal";
		damageTypes.eptemp = "SKYFALL.DESCRIPTORS.TempEp";
		// damageTypes.sptemp = "SKYFALL.DESCRIPTORS.TempSp";
		
		return new fields.SchemaField({
			value: new fields.StringField({
				required: true,
				initial: "",
				tooltip: "SKYFALL2.BONUSES.ValueTooltip",
				label: "SKYFALL2.BONUSES.Value",
			}),
			flavor: new fields.StringField({
				required: true,
				blank: true,
				choices: damageTypes,
				initial: "",
				tooltip: "SKYFALL2.BONUSES.FlavorTooltip",
				label: "SKYFALL2.BONUSES.Flavor",
			}),
			condition: new fields.StringField({
				required: true,
				initial: "",
				tooltip: "SKYFALL2.BONUSES.ConditionTooltip",
				label: "SKYFALL2.BONUSES.Condition",
			}),
			data: new fields.StringField({
				required: true,
				initial: "",
				tooltip: "SKYFALL2.BONUSES.DataTooltip",
				label: "SKYFALL2.BONUSES.Data",
			}),
			source: new fields.StringField({
				required: true,
				initial: "",
				tooltip: "SKYFALL2.BONUSES.SourceTooltip",
				label: "SKYFALL2.BONUSES.Source",
			}),
		});
	}
	
	_onCreate(document, target){
		const { fieldPath } = target.dataset;
		const current = foundry.utils.getProperty(
			document.toObject(true), fieldPath
		);
		const bonus = {};
		const inputs = target.closest("div").querySelectorAll('input');
		for (const input of [...inputs]) {
			bonus[input.name] = input.value ?? "";
		}
		current.push(bonus)
		const updateData = {}
		updateData[fieldPath] = current;
		return document.update(updateData);
	}

	_onDelete(document, target){
		const { fieldPath } = target.dataset;
		const current = foundry.utils.getProperty(
			document.toObject(true), fieldPath
		);
		const updateData = {}
		updateData[fieldPath] = current;
		return document.update(updateData);
	}

	_fieldPath(){
		const document = this.document;
		const property = foundry.utils.getProperty(document, this.fieldPath);
		if ( property ) return property;
		
		switch ( this.parent?.model?.name ) {
			case "SkillData":
				return "system.skills."
				break;
		
			default:
				break;
		}
	}

	_inputHeader(hidden) {
		const header = document.createElement("div");
		header.classList.add("flexrow");
		for (const [key, element] of Object.entries(this.element.fields)) {
			const label = document.createElement("div");
			if ( hidden.includes(key) ) {
				label.classList.add("hidden");
			}
			label.innerText = game.i18n.localize(element.label);
			label.dataset.tooltip = game.i18n.localize(element.options.tooltip);
			header.append(label);
		}
		const button = document.createElement("button");
		button.classList.add("flex0");
		button.innerHTML = SYSTEM.icons.reload;
		button.style.opacity = 0;
		button.disabled = true;
		header.append(button);
		return header;
	}

	_toInput(config) {
		let values = [
			{
				value: "", condition: "", source: "",
				flavor: "", data: "", _type: "create",
			},
			...config.value.toObject(),
		];
		const hidden = this.options.hidden;

		const wrapper = document.createElement('fieldset');
		wrapper.classList.add("roll-bonuses");
		const legend = document.createElement('legend');
		legend.innerText = game.i18n.localize(this.label);
		wrapper.append(legend);
		const list = document.createElement('div');
		list.classList.add("list");
		;
		const header = this._inputHeader(hidden);
		wrapper.append(header);
		
		const renderButton = (options) => {
			const controlButton = document.createElement('button');
			controlButton.innerHTML = SYSTEM.icons[options['data-action']];
			controlButton.classList.add("flex0");
			controlButton.type = "button";
			for (const [attr, value] of Object.entries(options)) {
				if (value === null) continue;
				controlButton.setAttribute(attr, value);
			}
			return controlButton;
		}
		for (const [i, element] of values.entries()) {
			const btn = renderButton({
				"data-action": element._type ?? "delete",
				"data-field-path": config.name ?? this.fieldPath,
				"data-entry-id": element._type ? null : (i - 1),
				"data-type": element._type == "create" ? this.name : null,
				disabled: element._type == "effect" ? true : null,
			});
			const div = document.createElement('div');
			div.classList.add('flexrow');
			const fields = [
				["value", element.value ?? ""],
				["flavor", element.flavor ?? ""],
				["condition", element.condition ?? ""],
				["data", element.data ?? ""],
				["source", element.source ?? ""],
			];
			for (const [key, value] of fields) {
				const input = foundry.applications.fields.createTextInput({
					name: !element._type ? `${config.name}.${i - 1}.${key}` : key,
					value: value,
					disabled: element._type == "effect"
				});
				if ( hidden.includes(key) ) {
					input.classList.add("hidden");
				}
				div.append(input);
			}
			div.append(btn);
			if ( element._type == "create" ) wrapper.append(div);
			else list.append(div);
		}
		wrapper.append(list)
		return wrapper;
	}

	_applyChangeAdd(value, delta, model, change) {
		const [formula, condition] = change.value.split( "?" );
		value.add({
			value: `(${formula})`,
			condition: condition,
			source: change.effect.name,
			_type: "effect",
		});
		return value;
	}
}