export class ConfirmDialog {
	title = "";
	content = "";
	callbackAction = null;
	args = null;

	/**
	 * Create a confirmation dialog
	 * @param {str} title
	 * @param {str} content
	 * @param {function} callbackAction returns True if Proceed is selected, False if Cancel is selected
	 * @param {*} args Other inputs to callbackAction
	 */
	constructor(title, content, callbackAction, args = null) {
		this.title = title;
		this.content = content;
		this.callbackAction = callbackAction;
		this.args = args;
		this.showDialog();
	}

	showDialog() {
		new Dialog({
			title: this.title,
			content: "<p>" + this.content + "</p>",
			buttons: {
				cancel: {
					label: "Cancel",
					callback: async () => {
						await this.callbackAction(false, this.args);
					}
				},
				confirm: {
					label: "Confirm",
					callback: async () => {
						await this.callbackAction(true, this.args);
					}
				}
			},
			default: "cancel"
		}).render(true);
	}
}
