
Hooks.once("polyglot.init", (LanguageProvider) => {
		class SkyfallLanguageProvider extends LanguageProvider {
			languages = {
				common: {
					font: "Thorass",
				},
				abyssal: {
					font: "Barazhad",
				},
				toranio: {
					font: "Dethek",
				},
				kia: {
					font: "Olde Thorass",
				},
				celestial: {
					font: "Celestial",
				},
				draconic: {
					font: "Iokharic",
				},
				elvish: {
					font: "Espruar",
				},
				anuri: {
					font: "Kargi",
				},
				kishi: {
					font: "Olde Thorass",
				},
				vampy: {
					font: "Infernal",
				},
				bo: {
					font: "Dethek",
				},
			};

			getSystemDefaultLanguage() {
				return "common";
			}

			async getLanguages() {
				const languagesSetting = game.settings.get("polyglot", "Languages");
				const langs = {};
				if (this.replaceLanguages) {
					CONFIG.SKYFALL.languages = {};
				}
				Object.keys(CONFIG.SKYFALL.languages).forEach((key) => {
					const label = CONFIG.SKYFALL.languages[key];
					if (label) {
						langs[key] = {
							label: game.i18n.localize(label.label),
							font: languagesSetting[key]?.font || this.languages[key]?.font || this.defaultFont,
							rng: languagesSetting[key]?.rng ?? "default",
						};
					}
				});
				this.languages = langs;
			}

			getUserLanguages(actor) {
				let knownLanguages = new Set();
				let literateLanguages = new Set();
				if ( ["guild", "creator"].includes(actor.type) ) return [knownLanguages, literateLanguages];
				for (let lang of actor.system.languages) knownLanguages.add(lang);
				return [knownLanguages, literateLanguages];
			}
		}

		game.polyglot.api.registerSystem(SkyfallLanguageProvider);
});