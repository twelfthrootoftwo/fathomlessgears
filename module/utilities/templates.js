/**
 * Handlebars templates preloader
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	// Define template paths to load
	const templatePaths = [
		"systems/hooklineandmecha/templates/partials/attribute-box.html",
		"systems/hooklineandmecha/templates/partials/attribute-box-new.html",
		"systems/hooklineandmecha/templates/partials/attribute-sidebar.html",
		"systems/hooklineandmecha/templates/partials/internal-partial.html",
	];

	// Load the template parts
	return loadTemplates(templatePaths);
};
