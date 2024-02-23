export function addFshManager(app, html) {
	console.log("Adding fsh manager")
	const compendium=html.siblings().filter(`.compendium-sidebar`);

	const presetManager=$(compendium).find(`.fsh-content-manager`);
	console.log(presetManager);
	if(presetManager.length==0) {
		const buttons=$(compendium).find(`.header-actions`);

		let button = document.createElement("button");
		button.setAttribute("style", "flex-basis: 100%; margin-top: 5px;");
		button.innerHTML = "<i class='fsh-content-manager i--s'></i> FSH Manager";
		button.addEventListener("click", () => {
			new FshManager().render(true);
		});
		buttons.after(button);
	}
}

class FshManager extends Application {
	datafiles=[]

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			template: "systems/hooklineandmecha/templates/fsh-manager.html",
			title: ".FSH Manager",
			width: 600,
			height: 600,
		});
	}

	activateListeners(html) {
		super.activateListeners(html);
		let fileInput = document.getElementById("fsh-file-select");
		if (fileInput) {
			fileInput.onchange = (ev) => {
				this._selectFsh(ev);
			};
		}
		document.getElementsByClassName("fsh-upload")[0]?.addEventListener("click", () => {
		  	this._onUploadButtonClick().then();
		});
	}

	_selectFsh(ev) {
		console.log("File selected")
		let fsh = ev.target.files[0];
		if (!fsh) return;
		this.newFsh=fsh;
	}

	async _onUploadButtonClick() {
		console.log("Button pressed")
		const fr = new FileReader();
		fr.readAsBinaryString(this.newFsh);
		console.log("Uploading")
		fr.addEventListener("load", (ev) => {
			this._onFshLoaded(ev.target.result).then();
		  });
		console.log("Upload complete")

		this.processFsh(this.newFsh)
		this.datafiles.push(this.newFsh)
		this.newFsh=null
	}

	_onFshLoaded(ev) {
		console.log("File read")
		console.log(ev)
	}

	processFsh(fsh) {
		console.log("Process fsh file here")
	}
}