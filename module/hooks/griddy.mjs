export default function griddySystemSetup(params) {
	return;
	if ( game.user.isGM ) {
		game.settings.set('griddy','itemTypes','armor,weapon,clothing,consumable,loot,equipment');
	}
	/**
	 * 
	 */
	Hooks.on('renderGriddy', (app, html, options)=>{
		// console.groupCollapsed("renderGriddy");
		console.log("renderGriddy");
		console.log(app, html, options);
	
		const actor = app.object;
		console.log(actor);
		options.cols = 10;
		options.rows = Math.ceil(actor.system.capacity.max / 10)+2;
		actor.setFlag('griddy.config',{
			cols: 10,
			rows: Math.ceil(actor.system.capacity.max / 10)+2,
		});
		actor.setFlag('world', 'showEquippedGrid', false);

		const itemTypes = ["weapon","armor","equipment"];
		const grid = html.find(`div[class^="inventory-grid-"]`);
		
		// UPDATE OUTLINE
		html.find('.item').each(function(){
			let item = actor.items.get(this.id);
			console.log(this, item);
		});
	});
}