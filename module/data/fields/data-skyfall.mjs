

export default class SkyfallDataModel extends foundry.abstract.DataModel {
	
	static _choicesKeyPair(config, key = 'id', label = 'label') {
		return Object.values(config).reduce((acc, i) => {
			const _key = i[key];
			const _label = i[label];
			acc[ _key ] = _label;
			return acc;
		}, {});
	}
	
	static _embbededSchema(config, model, {label = 'label', filter = null} = {}) {
		const fields = foundry.data.fields;
		return Object.values(config).reduce((acc, i) => {
			if ( filter && !i[filter]) return acc;
			acc[i.id] = new fields.EmbeddedDataField(model, {
				label: i[label]
			});
			return acc;
		}, {})
	}

	get document () {
		let parent = this.parent;
		while ( parent ) {
			if ( parent.documentName ) break;
			parent = parent.parent;
		}
		return parent;
	}

	get entryKey () {
		const fieldPath = this.schema.name == "element" ? this.schema.parent.fieldPath : this.schema.fieldPath;
		const property = foundry.utils.getProperty(this.document, fieldPath);
		return property.indexOf(this);
	}
	

	get getDataFields(){
		const data = this;
		const schema = data.schema;
		const dataFields = foundry.utils.flattenObject(data.toObject());
		
		for (const fieldPath of Object.keys(dataFields)) {
			dataFields[fieldPath] = schema.getField(fieldPath);
			if ( dataFields[fieldPath].hasOwnProperty('fieldPath') ) continue;
			
		}
		
		return foundry.utils.expandObject(dataFields);
	}
	
	get totalTooltip() {
		const roll = this.roll;
		const list = document.createElement('div');
		list.classList.add('flexcol', 'skyfall', 'tooltip-total');
		list.style.width = '150px';
		const baseli = document.createElement('div');
		baseli.classList.add('flexrow');
		const i = document.createElement('i');
		i.classList.add('flex2','fa-solid');
		const span = document.createElement('span');
		let operator;
		for (const term of roll.terms) {
			const li = baseli.cloneNode();
			const text = span.cloneNode();
			if ( term.operator ) {
				operator = term.operator == '+' ? 'fa-plus' : 'fa-minus';
				continue;
			} else {
				text.innerText = `${term.expression}{${term.options.source ?? 'N/A'}}`;
			}
			const icon = i.cloneNode();
			if ( operator ) icon.classList.add(operator);
			li.append(icon);
			li.append(text);
			list.append(li);
		}
		const hr = document.createElement('hr');
		const total = baseli.cloneNode();
		const text = span.cloneNode();
		text.classList.add('total');
		text.innerText = this.total;
		total.append(text);
		list.append(hr, total);
		return list.outerHTML;
	}

	/* -------------------------------------------- */
	/*  System Operations                           */
	/* -------------------------------------------- */
	
	_prepareData() {
	}
}