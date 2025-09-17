/**
 * Extend the base TokenRuler class to implement additional system-specific logic.
 * @extends {Token}
 */
export default class SKyfallTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
	/**
	 * @inheritdoc
	 * @param {DeepReadonly<Omit<TokenRulerWaypoint, "index"|"center"|"size"|"ray">>} waypoint
	 * @param {DeepReadonly<foundry.grid.types.GridOffset3D>} offset
	 */
	_getGridHighlightStyle(waypoint, offset) {
		const style = super._getGridHighlightStyle(waypoint, offset);
		this.#actorMovementStyle(style, waypoint);
		return style;
	}

	#actorMovementStyle(style, waypoint) {
		const colors = [0x33bc4e, 0xf1d836, 0xe72124];
		const dtColors = [0x5d9b6a, 0xb3a85f, 0xae5557];

		const movement = foundry.utils.getProperty(this, "token.actor.system.movement");
		const { cost, distance } = waypoint.measurement;
		if (movement) {
			const speed = movement[waypoint.action];
			const index = Math.clamp(Math.floor((cost - 1) / speed), 0, 2);
			style.color = waypoint.terrain?.difficulty > 1 ? dtColors[index] : colors[index];
		}
	}
}
