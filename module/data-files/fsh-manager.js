export function addFshManager(app, html) {
	console.log("Adding fsh manager")
	const compendium=html.siblings().filter(`.compendium-sidebar`);

	const presetManager=$(compendium).find(`.fsh-content-manager`);
	if(presetManager.length==0) {
		const buttons=$(compendium).find(`.header-actions`);

		let button = document.createElement("button");
		button.setAttribute("style", "flex-basis: 100%; margin-top: 5px;");
		button.innerHTML = "<i class='fsh-content-manager i--s'></i> FSH Manager";
		button.addEventListener("click", () => {
			new FshManager()
		});
		buttons.after(button);
	}
}

class FshManager extends Application {
	datafiles=[]

	constructor(...args) {
		super(...args);
		(async() => {
			console.log("Getting file list")
			const storageDir="systems/hooklineandmecha/storage/";
			const files=await FilePicker.browse("data",storageDir,{extensions: [".json"]})
			files.files.forEach((file) => {
				const filename=file.slice(file.lastIndexOf("/")+1,file.lastIndexOf("."));
				this.datafiles.push(filename);
			})
			console.log(`Files: ${this.datafiles}`)
			this.render(true)
		}) ();
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hooklineandmecha"],
			template: "systems/hooklineandmecha/templates/fsh-manager.html",
			title: ".FSH Manager",
			width: 400,
			height: 400,
		});
	}

	getData() {
		const data={
			datafiles: this.datafiles
		}
		return data
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
		
		html.find(".remove").click(this.removeDataFile.bind(this));
		
	}

	_selectFsh(ev) {
		console.log("File selected")
		let fsh = ev.target.files[0];
		if (!fsh) return;
		this.newFsh=fsh;
	}

	async _onUploadButtonClick() {
		//need to read the file as binary since Foundry's uploaders don't like the .fsh extension
		const fr = new FileReader();
		fr.readAsBinaryString(this.newFsh);
		fr.addEventListener("load", (ev) => {
			this._onFshLoaded(ev.target.result,this.newFsh.name).then();
		  });
	}

	async _onFshLoaded(ev,fileName) {;
		//convert binary back to (actual) json
		const fshFile=new File([ev],fileName.replace(".fsh",".json"),{"type":"application/json"});
		await FilePicker.upload("data","systems/hooklineandmecha/storage/",fshFile);
		this.datafiles.push(fileName.slice(file.lastIndexOf("/")+1,file.lastIndexOf(".")))
		this.datafiles.sort();
	}

	processFsh(fsh) {
		console.log("Process fsh file here")
	}
}