
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
		name: game.i18n.localize("SKYFALL2.SETTINGS.DisableExperience"),
		hint: game.i18n.localize("SKYFALL2.SETTINGS.DisableExperienceHint"),
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
		name: game.i18n.localize("SKYFALL2.SETTINGS.HPPerLevelMethod"),
		hint: game.i18n.localize("SKYFALL2.SETTINGS.HPPerLevelMethodHint"),
		scope: "world",
		config: true,
		choices: {
			"roll": game.i18n.localize("SKYFALL2.SETTINGS.HPPerLevelMethodRoll"),
			"mean": game.i18n.localize("SKYFALL2.SETTINGS.HPPerLevelMethodMean"),
			"user": game.i18n.localize("SKYFALL2.SETTINGS.HPPerLevelMethodUser"),
		},
		default: 'mean',
		type: String,
		onChange: () => location.reload()
	});

	/**
	 * Skip Usage config
	 */
	game.settings.register("skyfall", "skipUsageConfig", {
		name: game.i18n.localize("SKYFALL2.SETTINGS.SkipUsageConfig"),
		hint: game.i18n.localize("SKYFALL2.SETTINGS.SkipUsageConfigHint"),
		scope: "client",
		config: true,
		choices: {
			"shift": game.i18n.localize("SKYFALL2.SETTINGS.SkipUsageConfigShift"),
			"click": game.i18n.localize("SKYFALL2.SETTINGS.SkipUsageConfigClick"),
		},
		default: 'shift',
		type: String,
	});
	
	game.settings.register("skyfall", "sceneConfig", {
		name: game.i18n.localize("SKYFALL2.SETTINGS.sceneConfig"),
		hint: game.i18n.localize("SKYFALL2.SETTINGS.sceneConfigHint"),
		scope: "world",
		config: false,
		default: new skyfall.models.settings.SceneConfigSetting().toObject(),
		type: skyfall.models.settings.SceneConfigSetting,
	});

	if ( false ) { //game.user.getFlag('skyfall', 'developer')
		game.settings.registerMenu("skyfall", "abilityDescriptors", {
			name: "SKYFALL2.SETTING.AbilityDescriptors",
			label: "SKYFALL2.SETTING.AbilityDescriptors",
			hint: "SKYFALL2.SETTING.AbilityDescriptorsHint",
			type: skyfall.applications.AbilityDescriptorsSetting,
			restricted: true
		});
	}
	game.settings.register("skyfall", "abilityDescriptors", {
		name: game.i18n.localize("SKYFALL2.SETTING.AbilityDescriptors"),
		hint: game.i18n.localize("SKYFALL2.SETTING.AbilityDescriptorsHint"),
		scope: "world",
		config: false,
		default: new skyfall.models.settings.SkyfallDescriptors().toObject(),
		type: skyfall.models.settings.SkyfallDescriptors,
	});
}