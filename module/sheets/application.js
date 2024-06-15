export class HLMApplication extends Application {
    loading

    constructor(...args) {
        super(...args);
        this.loading=false;
    }

    startLoading(message) {
        document.getElementById("overlay").style.display = "block";
        this.updateLoadingMessage(`${message}`);
    }

    updateLoadingMessage(newMessage) {
        document.getElementById("loading-text").innerHTML=`<p>${newMessage}...</p>`
    }

    stopLoading() {
        document.getElementById("overlay").style.display = "none";
    }
}