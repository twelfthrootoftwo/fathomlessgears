import {GRID_SPACE_STATE} from "../constants.js";

export class GridSpace {
	state;
	internal;
	parentRegion;
	highlight;
	id;
	colour;

	/**
	 * Construct a space from an optional json record object
	 * @param {Object} json The parsed json object for this grid space
	 * @param {GridRegion} parent The region this space sits in
	 */
	constructor(json, parent) {
		if (json == null) {
			this.state = GRID_SPACE_STATE.locked;
			this.setInternal(null, null);
			this.colour = "empty";
		} else {
			this.state = json.state;
			this.setInternal(json.internal, json.colour);
			this.id = json.id;
		}
		this.parentRegion = parent;
		this.highlight = false;
	}

	/**
	 * Construct a JSON-ready encoding object
	 * @returns the object encoding this space as a JSON
	 */
	prepJson() {
		const jsonRecord = {};
		jsonRecord.state = this.state;
		jsonRecord.internal = this.internal;
		jsonRecord.id = this.id;
		jsonRecord.colour = this.colour;
		return jsonRecord;
	}

	/**
	 * Assigns a state to this space
	 * @param {GRID_SPACE_STATE} state
	 */
	setState(state) {
		this.state = state;
	}

	/**
	 * Assigns an internal to this space
	 * @param {str} uuid The uuid of the internal
	 */
	async setInternal(uuid, type) {
		this.internal = uuid;
		if (uuid) {
			this.colour = type;
		} else {
			this.colour = "empty";
		}
	}

	/**
	 * Toggle whether this space is intact/broken
	 * @returns True if a state was switched, False otherwise (eg if this space is locked)
	 */
	async toggleBroken() {
		switch (this.state) {
			case GRID_SPACE_STATE.locked:
				return false;
			case GRID_SPACE_STATE.intact:
				this.setState(GRID_SPACE_STATE.broken);
				if (this.internal) {
					await this.parentRegion.checkInternal(this.internal);
				}
				break;
			case GRID_SPACE_STATE.broken:
				this.setState(GRID_SPACE_STATE.intact);
				if (this.internal) {
					await this.parentRegion.checkInternal(this.internal);
				}
				break;
			default:
				return false;
		}
	}

	/**
	 * Performs any on-click actions
	 */
	async triggerClick() {
		await this.toggleBroken();
	}

	/**
	 * Check if this space contains a specific internal
	 * @param {str} uuid
	 * @returns True if this space contains that internal, otherwise False
	 */
	containsInternal(uuid) {
		if (uuid == null) {
			if (this.internal) return true;
			return false;
		}
		return this.internal === uuid;
	}

	/**
	 * Check if this space is intact
	 * @returns True if intact, False if broken/locked
	 */
	isIntact() {
		return this.state === GRID_SPACE_STATE.intact;
	}

	/**
	 * Toggle this space's internal highlight (lightening)
	 */
	toggleHighlight(gridElement) {
		const thisCover = gridElement
			.find(`#gridspace-${this.id}`)
			.find(".cover")[0];
		thisCover.classList.toggle("highlight-cover");
	}

	chooseBorders() {
		const position = this.getRegionPosition();
		const grid = this.parentRegion.gridSpaces;
		const borderHighlights = {
			top: false,
			bottom: false,
			left: false,
			right: false
		};

		if (position.y == 0) borderHighlights.top = true;
		else {
			const topSpace = this.parentRegion.parentGrid.findGridSpace(
				this.id - grid[0].length
			);
			if (this.internal != topSpace.internal) borderHighlights.top = true;
		}
		if (position.y == grid.length - 1) borderHighlights.bottom = true;
		else {
			const bottomSpace = this.parentRegion.parentGrid.findGridSpace(
				this.id + grid[0].length
			);
			if (this.internal != bottomSpace.internal)
				borderHighlights.bottom = true;
		}
		if (position.x == 0) borderHighlights.left = true;
		else {
			const leftSpace = this.parentRegion.parentGrid.findGridSpace(
				this.id - 1
			);
			if (this.internal != leftSpace.internal)
				borderHighlights.left = true;
		}
		if (position.x == grid[0].length - 1) borderHighlights.right = true;
		else {
			const rightSpace = this.parentRegion.parentGrid.findGridSpace(
				this.id + 1
			);
			if (this.internal != rightSpace.internal)
				borderHighlights.right = true;
		}
		this.borders = borderHighlights;
	}

	getRegionPosition() {
		let position = null;
		let y = 0;
		this.parentRegion.gridSpaces.forEach((row) => {
			let x = 0;
			row.forEach((space) => {
				if (space.id == this.id) {
					position = {x: x, y: y};
				}
				x += 1;
			});
			y += 1;
		});
		return position;
	}
}
