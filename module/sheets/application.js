export class HLMApplication extends Application {
    loading

    constructor(...args) {
        super(...args);
        this.loading=false;
    }

    startLoading() {
        document.getElementById("overlay").style.display = "block";
    }

    stopLoading() {
        document.getElementById("overlay").style.display = "none";
    }
}