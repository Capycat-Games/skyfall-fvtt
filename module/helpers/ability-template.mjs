/**
 * A helper class for building MeasuredTemplates for abilities
 * @extends {MeasuredTemplate}
 */
export default class AbilityTemplate extends MeasuredTemplate {

	/**
	 * A factory method to create an AbilityTemplate instance using provided data from an Item instance
	 * @param {Item} item               The Item object for which to construct the template
	 * @return {AbilityTemplate|null}     The template object, or null if the item does not produce a template
	 */
	static fromItem(item) {
		let rangeData = foundry.utils.getProperty(item, "system.target") || "";
		let shape = rangeData.shape;
		let distance = rangeData.length;
		let width = rangeData.width;
		let units = rangeData.units;
		
		if (!distance || !CONFIG.MeasuredTemplate.types[shape]) return null;
		// Prepare template data
		const templateData = {
			t: SYSTEM.areaTargets[shape].t,
			user: game.user.id,
			distance: distance,
			direction: 0,
			x: 0,
			y: 0,
			fillColor: game.user.color
		};
		// Additional type-specific data
		switch ( shape ) {
			case "cone":
				templateData.angle = 54;
				break;
			case "rect":
				templateData.distance = Math.hypot(distance, distance);
				templateData.width = width;
				templateData.direction = 45;
				break;
			case "ray":
				templateData.distance = distance;
				templateData.width = width;
				break;
			default:
				break;
		}

		// Return the template constructed from the item data
		const cls = CONFIG.MeasuredTemplate.documentClass;
		const template = new cls(templateData, {parent: canvas.scene});
		const object = new this(template);
		
		object.item = item;
		object.actorSheet = item.actor?.sheet || null;
		return object;
	}

	/* -------------------------------------------- */

	/**
	 * Creates a preview of the spell template
	 */
	drawPreview() {
		const initialLayer = canvas.activeLayer;

		// Draw the template and switch to the template layer
		this.draw();
		this.layer.activate();
		this.layer.preview.addChild(this);

		// Hide the sheet that originated the preview
		if ( this.actorSheet ) this.actorSheet.minimize();

		// Activate interactivity
		this.activatePreviewListeners(initialLayer);
	}

	/* -------------------------------------------- */

	/**
	 * Activate listeners for the template preview
	 * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
	 */
	activatePreviewListeners(initialLayer) {
		const handlers = {};
		let moveTime = 0;

		// Update placement (mouse-move)
		handlers.mm = event => {
			event.stopPropagation();
			let now = Date.now(); // Apply a 20ms throttle
			if ( now - moveTime <= 20 ) return;
			const center = event.data.getLocalPosition(this.layer);
			const snapped = canvas.grid.getSnappedPosition(center.x, center.y, 2);
			if ( game.release.generation < 10 ) this.document.update({x: snapped.x, y: snapped.y});
			else this.document.updateSource({x: snapped.x, y: snapped.y});
			this.refresh();
			moveTime = now;
		};

		// Cancel the workflow (right-click)
		handlers.rc = event => {
			this.layer._onDragLeftCancel(event);
			canvas.stage.off("mousemove", handlers.mm);
			canvas.stage.off("mousedown", handlers.lc);
			canvas.app.view.oncontextmenu = null;
			canvas.app.view.onwheel = null;
			initialLayer.activate();
			this.actorSheet?.maximize();
		};

		// Confirm the workflow (left-click)
		handlers.lc = event => {
			handlers.rc(event);
			const destination = canvas.grid.getSnappedPosition(this.document.x, this.document.y, 2);
			if ( game.release.generation < 10 ) this.document.update(destination);
			else this.document.updateSource(destination);
			canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.document.toObject()]);
		};

		// Rotate the template by 3 degree increments (mouse-wheel)
		handlers.mw = event => {
			if ( event.ctrlKey ) event.preventDefault(); // Avoid zooming the browser window
			event.stopPropagation();
			let delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
			let snap = event.shiftKey ? delta : 5;
			const update = {direction: this.document.direction + (snap * Math.sign(event.deltaY))};
			if ( game.release.generation < 10 ) this.document.update(update);
			else this.document.updateSource(update);
			this.refresh();
		};

		// Activate listeners
		canvas.stage.on("mousemove", handlers.mm);
		canvas.stage.on("mousedown", handlers.lc);
		canvas.app.view.oncontextmenu = handlers.rc;
		canvas.app.view.onwheel = handlers.mw;
	}

	targetTokens(){
		const template = canvas.templates.placeables[0];
		const bounds = template.bounds;
		const tokens = game.scenes.find(sc => sc.active).tokens;
		let targets = [];
		for (const token of tokens) {
			const tk = token.object;
			if ( !bounds.contains(tk.center.x,tk.center.y) ) continue;
			tk.setTarget(true);
			targets.push(token);
		}
		return targets;
	}
}
