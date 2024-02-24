export class ConfirmDialog {
    title=""
    content=""
    callbackAction=null
    args=null

    /**
     * Create a confirmation dialog
     * @param {str} title 
     * @param {str} content 
     * @param {function} callbackAction returns True if Proceed is selected, False if Cancel is selected
     * @param {*} args Other inputs to callbackAction
     */
    constructor(title,content,callbackAction,args) {
        this.title=title;
        this.content=content;
        this.callbackAction=callbackAction;
        this.args=args;
        this.showDialog();
    }

    showDialog() {
        new Dialog({
            title: this.title,
            content: this.content,
            buttons: {
                confirm: {
                    label: "Proceed",
                    callback: async () => {
                        await this.callbackAction(true,args);
                    }
                },
                confirm: {
                    label: "Cancel",
                    callback: async () => {
                        await this.callbackAction(false,args);
                    }
                },
                default: "Cancel",
            }
        }).render(true)
    }
}