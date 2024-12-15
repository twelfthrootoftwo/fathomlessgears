export class MessageHandler {
	async createChatMessage(text, speaker = ChatMessage.getSpeaker()) {
		if (game.sensitiveDataAvailable) {
			await game.tagHandler.createChatMessage(text, speaker);
		} else {
			await ChatMessage.create({
				speaker: {actor: speaker},
				content: text
			});
		}
	}

	static addMessageHandler() {
		game.messageHandler = new MessageHandler();
	}
}
