import {GridSpace} from "./grid-space.js";
import {Utils} from "../utilities/utils.js";
import {
	ACTOR_TYPES,
	SECTION_REGION_INDICES,
	GRID_SPACE_STATE,
	SECTION_NUMBERING_MAP
} from "../constants.js";

/**
 * Unpack a grid serial json into a Grid object
 * @param {HLMActor} actor The actor to assign to this new grid
 * @returns an unpacked Grid
 */
export async function constructGrid(actor) {
	const gridObject = new Grid(null);
	gridObject.actor = actor;
	const gridType = await actor.items.get(actor.system.gridType);
	for (let i = 0; i < gridType.system.hitRegions.length; i += 1) {
		if ((i == 0 || i == 4) && gridType.system.type == "fisher") {
			gridObject.gridRegions.push(null);
		}
		if ((i == 0 || i == 2) && gridType.system.type == "serpent_leviathan") {
			gridObject.gridRegions.push(null);
		}
		let regionData = gridType.system.hitRegions[i];
		let nameString = "";
		if (regionData.range.length > 1) {
			nameString =
				nameString +
				game.i18n.localize("HITZONE." + regionData.location);
			nameString =
				nameString + ` (${regionData.range[0]}-${regionData.range[1]})`;
		}
		let region = new GridRegion(
			{
				width: regionData.columns,
				height: regionData.rows,
				name: nameString
			},
			this,
			SECTION_NUMBERING_MAP[gridType.system.type][i]
		);
		gridObject.gridRegions.push(region);
		if ((i == 0 || i == 4) && gridType.system.type == "fisher") {
			gridObject.gridRegions.push(null);
		}
		if ((i == 2 || i == 4) && gridType.system.type == "serpent_leviathan") {
			gridObject.gridRegions.push(null);
		}
	}
	return gridObject;
}

export class Grid {
	gridRegions;
	actor;

	/**
	 * Construct a new Grid, either from a JSON encoding or fresh
	 * @param {string} json A JSON encoding of a grid. Will create a blank Grid object if this is not valid JSON
	 */
	constructor(json) {
		if (Utils.isJsonString(json)) {
			const baseObj = JSON.parse(json);
			this.actor = game.actors.get(baseObj.actor);
			this.gridRegions = [];
			baseObj.gridRegions.forEach((region) => {
				if (region == null) {
					this.gridRegions.push(null);
				} else {
					this.gridRegions.push(new GridRegion(region, this));
				}
			});
			this.prepareInternalBorders();
		} else {
			this.actor = null;
			this.gridRegions = [];
		}
	}

	/**
	 * Activate relevant listeners to a grid display HTML object
	 * @param {HTML} html The HTML document to add listeners to
	 * @returns the HTML with listeners(?)
	 */
	activateListeners(html) {
		html.find(".grid-space").click(this.clickGridSpace.bind(this));
		html.find(".grid-space").mouseenter(this._onMouseEnterSpace.bind(this));
		html.find(".grid-space").mouseleave(this._onMouseLeaveSpace.bind(this));
		return html;
	}

	/**
	 * When hovering a grid space, highlight the entire internal and pop out the internal's details
	 * @param {Event} event The mouse event
	 */
	_onMouseEnterSpace(event) {
		const targetSpace = this.actor.grid.findGridSpace(
			Utils.extractIntFromString(event.currentTarget.id)
		);
		if (targetSpace.containsInternal(null)) {
			this.actor.grid.highlightInternal(event, targetSpace);
			this.actor.grid.popInternal(event, targetSpace.internal);
		}
	}

	/**
	 * When end hovering a grid space, turn off internal highlight and unpop the internal's details
	 * @param {Event} event The mouse event
	 */
	_onMouseLeaveSpace(event) {
		const targetSpace = this.actor.grid.findGridSpace(
			Utils.extractIntFromString(event.currentTarget.id)
		);
		if (targetSpace.containsInternal(null)) {
			this.actor.grid.highlightInternal(event, targetSpace);
			this.actor.grid.unpopInternal(event);
		}
	}

	/**
	 * Serialise this Grid item
	 * @returns this Grid as a representative json (for saving to the actor document)
	 */
	toJson() {
		const copyGrid = new Grid(null);
		copyGrid.actor = this.actor._id;
		this.gridRegions.forEach((region) => {
			if (!region) {
				copyGrid.gridRegions.push(null);
			} else {
				copyGrid.gridRegions.push(region?.prepJson());
			}
		});
		return JSON.stringify(copyGrid);
	}

	setAllToIntact() {
		this.gridRegions.forEach((region) => {
			if (region) {
				region.gridSpaces.forEach((row) => {
					row.forEach((space) => {
						space.setState(GRID_SPACE_STATE.intact);
					});
				});
			}
		});
	}

	/**
	 * If the internal's state on the grid is updated, toggle it broken or not
	 * @param {str} uuid The internal to check
	 * @param {*} gridIntact Whether the internal is intact or not according to the grid
	 */
	async checkInternal(uuid, gridIntact) {
		const internal = await this.actor.items.get(uuid);
		const recordIntact = !(await internal.isBroken());
		if (recordIntact != gridIntact) {
			await this.actor.itemsManager.toggleInternalBroken(uuid);
			this.renderInternal(uuid);
		}
	}

	//Callback for clicking a grid space on the sheet
	clickGridSpace(event) {
		if (
			this.actor.testUserPermission(
				game.user,
				CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
			)
		) {
			//Current scope is ActorSheet, so need to get the grid object
			const space = this.actor.grid.findGridSpace(
				Utils.extractIntFromString(event.currentTarget.id)
			);
			space.triggerClick();
			this.actor
				.update({"system.grid": this.actor.grid.toJson()})
				.then(() => {
					Hooks.callAll("gridSpaceClick", space, this.actor);
				});
		}
	}

	/**
	 * Finds a grid space on this grid with a given id
	 * @param {int} id The id no. of the grid space to find
	 * @returns the GridSpace with this id
	 */
	findGridSpace(id) {
		let targetSpace = null;
		this.gridRegions.forEach((region) => {
			if (region) {
				region.gridSpaces.forEach((row) => {
					row.forEach((space) => {
						if (space.id == id) targetSpace = space;
					});
				});
			}
		});
		return targetSpace;
	}

	prepareInternalBorders() {
		this.gridRegions.forEach((region) => {
			if (region) {
				region.gridSpaces.forEach((row) => {
					row.forEach((space) => {
						if (space.internal) space.chooseBorders();
					});
				});
			}
		});
	}

	/**
	 * From a default (fully locked) grid, mark selected spaces as unlocked
	 * @param {Array[int]} unlockList The list of spaces to mark unlocked
	 */
	applyUnlocksById(unlockList) {
		if (this.actor.type != ACTOR_TYPES.fisher) {
			console.error("Attempted to unlock grid spaces on a fish grid");
			return;
		}
		unlockList.forEach((id) => {
			const space = this.findGridSpace(id);
			space.state = GRID_SPACE_STATE.intact;
		});
	}

	/**
	 * From a default (fully locked) grid, mark selected spaces as unlocked
	 * @param {Array[int]} unlockList The list of spaces to mark unlocked
	 */
	applyUnlocksByCoords(unlockData) {
		if (this.actor.type != ACTOR_TYPES.fisher) {
			console.error("Attempted to unlock grid spaces on a fish grid");
			return;
		}
		Object.entries(unlockData).forEach(([key, unlocks]) => {
			let targetRegion =
				this.gridRegions[SECTION_REGION_INDICES.fisher[key]];
			unlocks.forEach((position) => {
				targetRegion.gridSpaces[position.y][position.x].state =
					GRID_SPACE_STATE.intact;
			});
		});
	}

	/**
	 * Toggle highlight for grid spaces belonging to a particular internal
	 * @param {string} uuid The UUID of the internal to find
	 * @param {bool} highlight Whether to turn on or off highlight display
	 */
	highlightInternal(event, originSpace) {
		const popout = $(event.target).closest(".grid-display");
		originSpace.parentRegion.gridSpaces.forEach((row) => {
			row.forEach((space) => {
				if (space.containsInternal(originSpace.internal)) {
					space.toggleHighlight(popout);
				}
			});
		});
	}

	async renderInternal(event, uuid) {
		const display = $(event.target).closest(".grid-display");
		const popout = display.find("#internal-popout")[0];
		if (popout) {
			const viewedInternal = this.actor.items.get(uuid);
			const internalHtml = await renderTemplate(
				"systems/fathomlessgears/templates/partials/internal-partial.html",
				{
					internal: viewedInternal,
					popout: true,
					fixedState: true
				}
			);
			popout.innerHTML = internalHtml;
		}
		return popout;
	}

	/**
	 * Create a popout display of an internal's details
	 * @param {str} uuid The ID of the internal to pop
	 */
	async popInternal(event, uuid) {
		const popout = await this.renderInternal(event, uuid);
		$(popout).css("z-index", 150);
		$(popout).css("max-width", 350);
		popout.classList.toggle("visible");
	}

	/**
	 * Remove a popped-out internal's details
	 */
	async unpopInternal(event) {
		const display = $(event.target).closest(".grid-display");
		const popout = display.find("#internal-popout")[0];
		popout.innerHTML = "";
		popout.classList.toggle("visible");
	}

	calculateHP() {
		let hp = 0;
		this.gridRegions.forEach((region) => {
			if (region) {
				region.gridSpaces.forEach((row) => {
					row.forEach((space) => {
						if (space.state == GRID_SPACE_STATE.intact) hp = hp + 1;
					});
				});
			}
		});
		return hp;
	}

	calculateDamaged() {
		let hp = 0;
		this.gridRegions.forEach((region) => {
			if (region) {
				region.gridSpaces.forEach((row) => {
					row.forEach((space) => {
						if (space.state == GRID_SPACE_STATE.broken) hp = hp + 1;
					});
				});
			}
		});
		return hp;
	}
}

class GridRegion {
	width;
	height;
	gridSpaces = [];
	parentGrid;
	name;
	numbering = [];

	/**
	 * Construct a GridRegion
	 * @param {Object} json The parsed JSON encoding representing this region, Requires width and height fields
	 * @param {Grid} parent The Grid this GridRegion belongs to
	 * @param {int} startId The id of the top left grid space
	 */
	constructor(json, parent, startId) {
		this.width = json.width;
		this.height = json.height;
		this.name = json.name;
		let idCounter;
		if (!json.gridSpaces) {
			idCounter = startId;
		}
		for (let i = 0; i < json.height; i++) {
			this.gridSpaces.push([]);
			for (let j = 0; j < json.width; j++) {
				if (json.gridSpaces) {
					this.gridSpaces[i].push(
						new GridSpace(json.gridSpaces[i][j], this)
					);
				} else {
					const space = new GridSpace(null, this);
					space.id = idCounter;
					space.setState(GRID_SPACE_STATE.locked);
					idCounter += 1;
					this.gridSpaces[i].push(space);
				}
			}
		}
		for (let j = 0; j < json.width; j++) {
			this.numbering.push((j + 1).toString());
		}
		this.parentGrid = parent;
	}

	/**
	 * Prepare an object to be turned into a JSON later
	 * @returns an object encoding this GridRegion (width, height, all grid spaces)
	 */
	prepJson() {
		const jsonRecord = {};
		jsonRecord.width = this.width;
		jsonRecord.height = this.height;
		jsonRecord.name = this.name;
		jsonRecord.gridSpaces = [];
		this.gridSpaces.forEach((row) => {
			let rowRecord = [];
			row.forEach((space) => {
				rowRecord.push(space.prepJson());
			});
			jsonRecord.gridSpaces.push(rowRecord);
		});
		return jsonRecord;
	}

	/**
	 * Check whether an internal is broken & pass the result to parent grid
	 * @param {string} uuid The uuid of internal to check
	 */
	async checkInternal(uuid) {
		let intact = false;
		this.gridSpaces.forEach((row) => {
			row.forEach((space) => {
				if (space.containsInternal(uuid) && space.isIntact()) {
					intact = true;
				}
			});
		});
		await this.parentGrid.checkInternal(uuid, intact);
	}
}
