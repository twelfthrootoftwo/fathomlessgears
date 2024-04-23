export class HLMApplication extends Application {
    loading

    constructor(...args) {
        super(...args);
        this.loading=false;
    }

    startLoading() {
        console.log("Loading start")
        console.log(document);
        document.getElementById("overlay").style.display = "block";
    }

    stopLoading() {
        console.log("Loading stop")
        document.getElementById("overlay").style.display = "none";
    }
}