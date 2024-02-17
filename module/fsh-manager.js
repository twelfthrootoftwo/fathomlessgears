function addFshManager(app, html) {
	const compendium=html.siblings().filter(`.compendium-sidebar`);

	const presetManager=$(compendium).find(`.fsh-content-manager`);
	console.log(presetManager);
	if(presetManager.length==0) {
		const buttons=$(compendium).find(`.header-actions`);

		let button = document.createElement("button");
		button.setAttribute("style", "flex-basis: 100%; margin-top: 5px;");
		button.innerHTML = "<i class='fsh-content-manager i--s'></i> FSH Manager";
		button.addEventListener("click", () => {
			//Add on-click listener
		});
		buttons.after(button);
	}
	
}