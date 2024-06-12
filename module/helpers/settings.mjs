
/**
 * Register all of the system's settings.
 */
export const registerSystemSettings = function() {
	// Internal System Migration Version
	game.settings.register("skyfall", "systemMigrationVersion", {
		name: "System Migration Version",
		scope: "world",
		config: false,
		type: String,
		default: ""
	});

	/**
	* Option to disable XP bar for session-based or story-based advancement.
	*/
	game.settings.register("skyfall", "disableExperience", {
		name: game.i18n.localize("SKYFALL.SETTING.DISABLEEXPERIENCE"),
		hint: game.i18n.localize("SKYFALL.SETTING.DISABLEEXPERIENCEHINT"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: () => location.reload()
	});
	
	/**
	* Define HP calculation method
	*/
	game.settings.register("skyfall", "hpPerLevelMethod", {
		name: game.i18n.localize("SKYFALL.SETTING.HPPERLEVELMETHOD"),
		hint: game.i18n.localize("SKYFALL.SETTING.HPPERLEVELMETHODHINT"),
		scope: "world",
		config: true,
		choices: {
			"roll": game.i18n.localize("SKYFALL.SETTING.HPPERLEVELMETHODROLL"),
			"mean": game.i18n.localize("SKYFALL.SETTING.HPPERLEVELMETHODMEAN"),
			"user": game.i18n.localize("SKYFALL.SETTING.HPPERLEVELMETHODUSER"),
		},
		default: 'mean',
		type: String,
		onChange: () => location.reload()
	});

	/**
	 * Skip Usage config
	 */
	game.settings.register("skyfall", "skipUsageConfig", {
		name: game.i18n.localize("SKYFALL.SETTING.SKIPUSAGECONFIG"),
		hint: game.i18n.localize("SKYFALL.SETTING.SKIPUSAGECONFIGHINT"),
		scope: "client",
		config: true,
		choices: {
			"shift": game.i18n.localize("SKYFALL.SETTING.SKIPUSAGECONFIGSHIFT"),
			"click": game.i18n.localize("SKYFALL.SETTING.SKIPUSAGECONFIGCLICK"),
		},
		default: 'shift',
		type: String,
	});
	
}