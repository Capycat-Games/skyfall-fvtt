export class EscolhasField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		super({...fields}, { label: "TESTE", ...options });
	}
}

export class EscolhasField2 extends foundry.data.fields.ObjectField {
	constructor(_fields={}, options={}) {
		const fields = foundry.data.fields;
		super({
			tipo: new fields.StringField({required: true, choices:["","fixo","disponivel","condicional"], initial: "fixo"}),
			escolhido: new fields.BooleanField({initial: false}),
			// REFERE A UMA ROLLDATA DO ATOR DEFINIDA PELA TRADIÇÃO OCULTISTA
			condicao: new fields.StringField({required: true, blank: true})
		}, { label: "", ...options });
	}
	/* TARGET
		{
			quantidade: 2,
			condicao: "system.atributo_chave"
			options: {
				for: { tipo: "fixo", escolhido: false, condicao }
				...
			}
		}
	*/
}

export class Escolhas extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			tipo: new fields.StringField({required: true, choices:["","fixo","disponivel","condicional"], initial: "fixo"}),
			escolhido: new fields.BooleanField({initial: false}),
			// REFERE A UMA ROLLDATA DO ATOR DEFINIDA PELA TRADIÇÃO OCULTISTA
			condicao: new fields.StringField({required: true, blank: true})
		}
	}
}

export class Sigilo extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			nome: new fields.StringField({required: true, blank: false}),
			tipo:  new fields.StringField({required: true, choices:["prefixo","sufixo"], initial: "prefixo"}),
			grau: new fields.NumberField({required: true, integer: true, min: 1, max:4}),
			equipamento: new fields.StringField({required: true, choices:["arma","armadura"], initial: "prefixo"}),
			disparo: new fields.StringField({required: true, choices: SYSTEM.ACOESTIPO, initial: "prefixo"}),
			efeito: new fields.StringField({required: true, blank: true}),
			cargas: new fields.SchemaField({
				value: new fields.NumberField({required: true, integer: true, min: 0}),
				max: new fields.NumberField({required: true, integer: true, min: 0}),
			}),
			fragmentos: new fields.NumberField({required: true, integer: true, min: 1, max:4}),
			imbuicao: new fields.StringField({required: true, choices:["permanente","recarga"], initial: "permanente"}),
		}
	}
}

// export {}
