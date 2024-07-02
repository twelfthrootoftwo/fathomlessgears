/**
 * Handlebars templates preloader
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	// Define template paths to load
	const templatePaths = [
		"systems/fathomlessgears/templates/partials/attribute-box.html",
		"systems/fathomlessgears/templates/partials/attribute-sidebar.html",
		"systems/fathomlessgears/templates/partials/internal-partial.html",
		"systems/fathomlessgears/templates/partials/attack-info.html",
		"systems/fathomlessgears/templates/partials/tag-row.html",
		"systems/fathomlessgears/templates/partials/grid-box.html",
		"systems/fathomlessgears/templates/partials/grid-region.html",
	];

	// Load the template parts
	return loadTemplates(templatePaths);
};
