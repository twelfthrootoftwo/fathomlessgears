//This code is modified from Eriku33's Image Hover: https://github.com/Eriku33/Foundry-VTT-Image-Hover


/**
 * Default settings
 */
let imagePositionSetting = "Bottom left"; // location of character art
let imageSizeSetting = 4; // size of character art

let cacheImageNames = {}; // url file names cache

/**
 * Copy Placeable HUD template
 */
export class GridHoverHUD extends BasePlaceableHUD {
	/**
	 * Retrieve and override default options for BasePlaceableHUD
	 */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "grid-hover-hud",
			classes: [...super.defaultOptions.classes, "grid-hover-hud", "popout"],
			minimizable: false,
			resizable: true,
			template:
				"systems/fathomlessgears/templates/grid-hover-template.html", // HTML template
		});
	}

	/**
	 * Get image data for html template
	 */
	getData() {
		const data = super.getData();
		const tokenObject = this.object;
		let grid = tokenObject.actor.grid; // Character art

		data.grid = grid;
		return data;
	}

	/**
	 * Attempts to get the file extention of the string input
	 * @param {String} file file path in folder
	 */
	fileExtention(file) {
		let fileExt = "png"; // Assume art is a image by default
		const endOfFile = file.lastIndexOf(".") + 1;
		if (endOfFile !== undefined)
			fileExt = file.substring(endOfFile).toLowerCase();

		return fileExt;
	}

	/**
	 * Set handout position, this uses the client screen position and zoom level to scale the image.
	 */
	setPosition() {
		if (!this.object) return;
		this.updatePosition();
	}

	/**
	 * While hovering over a token and zooming or moving screen position, we want to reposition the image and scale it.
	 */
	updatePosition() {
		let url = this.object.actor.grid; // Character art

		if (url in cacheImageNames) {
			this.applyToCanvas(url);
		} else {
			// This only happens when you change a image on the canvas.
			this.cacheAvailableToken(url, true);
		}
	}

	/**
	 * Preload the url to find the width and height.
	 * @param {String} url Url of the image/video to get dimensions from.
	 * @return {Promise} Promise which returns the dimensions of the image/video in 'width' and 'height' properties.
	 */
	loadSourceDimensions() {
		return new Promise((resolve) => {
			resolve({
				width: 800, // send back result
				height: 800,
			});
		});
	}

	/**
	 * Add image to cache and show on canvas
	 * @param {String} url Url of the image/video to get dimensions from.
	 * @param {Boolean} applyToScreen Apply image to screen or just cache image.
	 */
	cacheAvailableToken(grid, applyToScreen) {
		game.gridHover.loadSourceDimensions().then(({width, height}) => {
			cacheImageNames[grid] = {
				width: width,
				height: height,
			};
			if (applyToScreen) {
				this.applyToCanvas(grid);
			}
		});
	}

	/**
	 * Rescale image to fit screen size, apply css
	 * @param {String} url Url of the image/video to get dimensions from.
	 */
	applyToCanvas(grid) {
		const imageWidth = cacheImageNames[grid].width; //width of original image
		const imageHeight = cacheImageNames[grid].height; //height of original image
		const [xAxis, yAxis, imageWidthScaled] = this.changePosition(
			imageWidth,
			imageHeight
		); // move image to correct verticle position.
		const position = {
			// CSS
			width: imageWidthScaled,
			height: imageWidthScaled,
			left: xAxis,
			top: yAxis,
		};
		this.element.css(position); // Apply CSS to element
	}

	/**
	 * Rescale original image and move to correct location within the canvas.
	 * imagePositionSetting options include Bottom right/left, Top right/left and Centre
	 * @param {Number} imageWidth width of original image (pixels)
	 * @param {Number} imageHeight height of original image (pixels)
	 */
	changePosition(imageWidth, imageHeight) {
		const centre = canvas.scene._viewPosition; // Middle of the screen
		let imageWidthScaled =
			window.innerWidth / (imageSizeSetting * centre.scale); // Scaled width of image to canvas
		let imageHeightScaled = imageWidthScaled * (imageHeight / imageWidth); // Scaled height from width
		const windowWidthScaled = window.innerWidth / centre.scale;
		const windowHeightScaled = window.innerHeight / centre.scale;
		let xAxis = 0;
		let yAxis = 0;

		if (imageHeightScaled > windowHeightScaled) {
			// Height of image bigger than window height
			imageWidthScaled =
				(windowHeightScaled / imageHeightScaled) * imageWidthScaled;
			imageHeightScaled = windowHeightScaled;
		}

		if (imagePositionSetting.includes("Bottom")) {
			// move image to bottom of canvas
			yAxis = centre.y + windowHeightScaled / 2 - imageHeightScaled;
		} else {
			yAxis = centre.y - windowHeightScaled / 2;
		}

		const sidebar = document.getElementById("sidebar");
		const sidebarCollapsed = sidebar.classList.contains("collapsed"); // take into account if sidebar is collapsed

		if (imagePositionSetting == "Centre") {
			if (sidebarCollapsed) {
				return [
					centre.x - imageWidthScaled / 2,
					centre.y - imageHeightScaled / 2,
					imageWidthScaled,
				];
			} else {
				return [
					centre.x -
						imageWidthScaled / 2 -
						sidebar.offsetWidth / centre.scale / 3,
					centre.y - imageHeightScaled / 2,
					imageWidthScaled,
				];
			}
		}

		if (imagePositionSetting.includes("right")) {
			// move image to right of canvas
			if (imagePositionSetting.includes("Bottom") && sidebarCollapsed) {
				xAxis = centre.x + windowWidthScaled / 2 - imageWidthScaled;
			} else {
				const sidebarWidthScaled =
					sidebar.offsetWidth / centre.scale +
					parseFloat(
						window
							.getComputedStyle(sidebar, null)
							.getPropertyValue("margin-right")
					) /
						centre.scale;
				xAxis =
					centre.x +
					windowWidthScaled / 2 -
					imageWidthScaled -
					sidebarWidthScaled;
			}
		} else {
			xAxis = centre.x - windowWidthScaled / 2;
		}
		return [xAxis, yAxis, imageWidthScaled];
	}

	/**
	 * check requirements then show character art
	 * @param {*} token token passed in
	 * @param {Boolean} hovered if token is mouseovered
	 * @param {Number} delay hover time requirement (milliseconds) to show art.
	 */
	showArtworkRequirements(token, hovered, delay) {
		/**
		 * Hide art when dragging a token.
		 */
		if (event && event.buttons > 0) return;

		if (
			hovered &&
			(canvas.activeLayer.name == "TokenLayer" ||
				canvas.activeLayer.name == "TokenLayerPF2e")
		) {
			// Show token image if hovered, otherwise don't
			setTimeout(function () {
				if (
					token == canvas.tokens.hover &&
					token.actor.grid == canvas.tokens.hover.actor.grid
				) {
					game.gridHover.bind(token);
				} else {
					if(!this.lock) {
						console.log("Clearing in requirements 1")
						game.gridHover.clear();
					}
				}
			}, delay);
		} else {
			if(!this.lock) {
				console.log("Clearing in requirements 2")
				this.clear();
			}
		}
	}

	toggleLock() {
		if(this.lock) {
			this.lock=false;
			if(!this.hovering) {
				this.clear();
			}
		} else {
			this.lock=true;
		}
		console.log(`Toggling lock to ${this.lock}`);
	}

	/**
		 * Add Image Hover display to html on load.
		 */
	static addGridHUD(html) {
		html[0].style.zIndex = 70;
		html.append(`<template id="grid-hover-hud"></template>`);
		game.gridHover = new GridHoverHUD();
		game.gridHover.initialiseHooks();
	};

	initialiseHooks() {
		/**
		 * Display image when user hovers mouse over a actor
		 * Must be used on the token layer and have relevant actor permissions (configurable settings by the game master)
		 * @param {*} token passed in token
		 * @param {Boolean} hovered if token is mouseovered
		 */
		Hooks.on("hoverToken", (token, hovered) => {
			game.gridHover.hovering=hovered
			if(game.gridHover.lock) {
				return;
			}
			if (!hovered) {
				console.log("Clearing in hoverToken")
				game.gridHover.clear();
				return;
			}

			game.gridHover.showArtworkRequirements(token, hovered, 0);
		});

		/**
		 * Remove character art when deleting/dragging token (Hover hook doesn't trigger while token movement animation is on).
		 */
		Hooks.on("preUpdateToken", (...args) => clearArt());
		Hooks.on("deleteToken", (...args) => clearArt());

		/**
		 * Occasions to remove character art from screen due to weird hover hook interaction.
		 */
		Hooks.on("closeActorSheet", (...args) => clearArt());
		Hooks.on("closeSettingsConfig", (...args) => clearArt());
		Hooks.on("closeApplication", (...args) => clearArt());

		/**
		 * When user scrolls/moves the screen position, we want to relocate the image.
		 */
		Hooks.on("canvasPan", (...args) => {
			if (typeof game.gridHover !== "undefined") {
				if (
					typeof game.gridHover.object === "undefined" ||
					game.gridHover.object === null
				) {
					return;
				}
				game.gridHover.updatePosition();
			}
		});
	}
}

/**
 * Clear art unless GM is showing users art.
 */
function clearArt() {
	if (game.gridHover) {
		if(!game.gridHover.lock) {
			console.log("Clearing in clearArt")
			game.gridHover.clear();
		}
	}
}
