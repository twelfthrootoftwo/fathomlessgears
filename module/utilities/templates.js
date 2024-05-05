/**
 * Handlebars templates preloader
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	// Define template paths to load
	const templatePaths = [
		// Attribute list partial.
		"systems/hooklineandmecha/templates/partials/attributes-tab.html",
		"systems/hooklineandmecha/templates/partials/attribute-box.html",
		"systems/hooklineandmecha/templates/partials/attribute-sidebar.html",
	];

	// Load the template parts
	return loadTemplates(templatePaths);
};
