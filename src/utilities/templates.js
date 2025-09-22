/**
 * Handlebars templates preloader
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	// Define template paths to load
	const templatePaths = [
		"systems/fathomlessgears/templates/partials/attack-info.html",
		"systems/fathomlessgears/templates/partials/attribute-box.html",
		"systems/fathomlessgears/templates/partials/attribute-sidebar.html",
		"systems/fathomlessgears/templates/partials/collapsible-roll.html",
		"systems/fathomlessgears/templates/partials/damage-partial.html",
		"systems/fathomlessgears/templates/partials/development-partial.html",
		"systems/fathomlessgears/templates/partials/grid-box.html",
		"systems/fathomlessgears/templates/partials/grid-region.html",
		"systems/fathomlessgears/templates/partials/grid-space.html",
		"systems/fathomlessgears/templates/partials/history-table.html",
		"systems/fathomlessgears/templates/partials/history-list-item.html",
		"systems/fathomlessgears/templates/partials/initialise-cover.html",
		"systems/fathomlessgears/templates/partials/internal-partial.html",
		"systems/fathomlessgears/templates/partials/labelled-roll-partial.html",
		"systems/fathomlessgears/templates/partials/labels.html",
		"systems/fathomlessgears/templates/partials/label-toggle.html",
		"systems/fathomlessgears/templates/partials/location-roll.html",
		"systems/fathomlessgears/templates/partials/location-roll-box.html",
		"systems/fathomlessgears/templates/partials/maneuver-partial.html",
		"systems/fathomlessgears/templates/partials/narrative-dice-partial.html",
		"systems/fathomlessgears/templates/partials/narrative-result-partial.html",
		"systems/fathomlessgears/templates/partials/roll-element-toggle.html",
		"systems/fathomlessgears/templates/partials/roll-modifier-list-partial.html",
		"systems/fathomlessgears/templates/partials/tag-buttons.html",
		"systems/fathomlessgears/templates/partials/tag-roll.html",
		"systems/fathomlessgears/templates/partials/tag-row.html",
		"systems/fathomlessgears/templates/partials/tag-tooltip.html",
		"systems/fathomlessgears/templates/messages/tag-message.html",
		"systems/fathomlessgears/templates/messages/history-table-roll-message.html",
		"systems/fathomlessgears/templates/messages/meltdown-table-roll-message.html"
	];

	// Load the template parts
	return loadTemplates(templatePaths);
};
