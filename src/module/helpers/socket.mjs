export default class SkyfallSocketHandler {
	constructor() {
		this.identifier = "system.skyfall" // whatever event name is correct for your package
		this.registerSocketHandlers()
	}

	registerSocketHandlers() {
		game.socket.on(this.identifier, ({ type, payload }) => {
			switch (type) {
				case "RollCatharsis":
					this.#onRollCatharsis(payload);
					break;
				case "ReclaimTableCatharsis":
					this.#onReclaimTableCatharsis(payload);
					break;
				default:
					throw new Error('unknown type');
			}
		});
	}

	emit(type, payload) {
		return game.socket.emit(this.identifier, { type, payload })
	}

	#onReclaimTableCatharsis(arg) {
		if ( game.userId == game.users.activeGM?.id ) {
			skyfall.ui.sceneConfig.scene.addCatharsis(-1);
			skyfall.ui.sceneConfig.scene.rechargeAbility();
		}
	}

	// ADD CATHARSIS ROLL ON ANOTHER PLAYER MESSAGE
	async #onRollCatharsis(arg) {
		if ( game.userId == game.users.activeGM?.id ) {
			const message = game.messages.get(arg.id);
			await message.update(arg.updateData);
		}
	}
}