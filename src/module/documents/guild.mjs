/**
 * Extend the base Actor document
 * @extends {Actor}
 */
export default class SkyfallGuild extends Actor {
	
	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Core Methods                                */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Helpers                                     */
	/* -------------------------------------------- */

	async produceGuildPoints(){
		const select = foundry.applications.fields.createSelectInput({
			options: [
				{value: 2, label: 'SKYFALL.GUILD.ArcLengthShort'},
				{value: 5, label: 'SKYFALL.GUILD.ArcLengthLong'}
			],
			name: 'arc', value: 2, blank: false,
			localize: true, labelAttr: 'label', valueAttr: 'value'
		});
		const content = foundry.applications.fields.createFormGroup({
			input: select,
			label: "SKYFALL2.GUILD.ArcLength",
			localize: true,
		});
		const arc = await foundry.applications.api.DialogV2.prompt({
			window: {
				title: game.i18n.localize("SKYFALL2.DIALOG.ProduceGuildPoints")
			},
			position: { width: 300 },
			content: content,
			ok: {
				callback: (event, button, dialog) => button.form.elements.arc.value
			}
		});
		
	}
}