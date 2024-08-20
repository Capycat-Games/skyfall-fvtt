/**
 * Extend the base Token class to implement additional system-specific logic.
 */
export default class TokenSkyfall extends Token {

	/**
	 * Draw a status effect icon
	 * @param {string} src
	 * @param {PIXI.ColorSource|null} tint
	 * @returns {Promise<PIXI.Sprite|undefined>}
	 * @protected
	 */
	async _drawEffect(src, tint) {
		if ( !src ) return;
		const tex = await loadTexture(src, {fallback: "icons/svg/hazard.svg"});
		const icon = new PIXI.Sprite(tex);
		icon.tint = tint ?? 0xFFFFFF;
		return this.effects.addChild(icon);
	}

	_refreshEffects() {
		super._refreshEffects();
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	_drawBar(number, bar, data) {
		if ( data.attribute === "resources.hp" || data.attribute === "resources.ep" ){
			return this._drawHPEPBar(number, bar, data);
		}
		return super._drawBar(number, bar, data);
	}

	/* -------------------------------------------- */

	_drawHPEPBar(number, bar, data) {
		// Extract health data
		const actorData = this.document.actor.system;
		let {value, max, temp, tempmax} = foundry.utils.getProperty(actorData, data.attribute);
		let min = max * -1;
		
		temp = Number(temp || 0);
		tempmax = Number(tempmax || 0);

		// Allocate percentages of the total
		const tempPct = Math.clamp(temp, 0, max) / max;
		const valuePct = Math.clamp(value, 0, max) / max;
		const negativePct = Math.clamp(value, min, 0) / min;
		const colorPct = Math.clamp(value, 0, max) / max;

		// Determine colors to use
		const blk = 0x000000;
		const tknBarColor = [
			[(1-(colorPct/2)), colorPct, 0],
			[(0.5 * colorPct), (0.7 * colorPct), 0.5 + (colorPct / 2)]
		]
		const hpColor = PIXI.utils.rgb2hex(tknBarColor[number]);

		const COLORS = {
			"resources.hp": {
				temp: 0xFF0000,
				tempmax: 0x440066,
				negmax: 0xAA0000,
			},
			"resources.ep": {
				temp: 0x0000FF,
				tempmax: 0x440066,
				negmax: 0x550000,
			},
		}
		const c = COLORS[data.attribute];
		
		// Determine the container size (logic borrowed from core)
		const w = this.w;
		let h = Math.max((canvas.dimensions.size / 12), 8);
		if ( this.document.height >= 2 ) h *= 1.6;  // Enlarge the bar for large tokens
		const bs = Math.clamp(h / 8, 1, 2);
		const bs1 = bs+1;

		// Overall bar container
		bar.clear()
		bar.beginFill(blk, 0.5).lineStyle(bs, blk, 1.0).drawRoundedRect(0, 0, w, h, 3);

		// Health bar
		bar.beginFill(hpColor, 1.0).lineStyle(bs, blk, 1.0).drawRoundedRect(0, 0, valuePct*w, h, 2)

		// Temporary hit points
		if ( temp > 0 ) {
			bar.beginFill(c.temp, 1.0).lineStyle(0).drawRoundedRect(bs1, bs1, (tempPct*w)-(2*bs1), h-(2*bs1), 1);
		}

		// Negative HP
		if (value < 0) {
		  bar.beginFill(c.negmax, 1.0).lineStyle(bs, blk, 1.0).drawRoundedRect((1-negativePct)*w, 0, negativePct*w, h, 2);
		}


		// Set position
		let posY = (number === 0) ? (this.h - h) : 0;
		bar.position.set(0, posY);
	}
	
}