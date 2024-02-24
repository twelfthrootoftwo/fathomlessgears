/**
 * Handlebars templates preloader
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	// Define template paths to load
	const templatePaths = [
		// Attribute list partial.
		"systems/hooklineandmecha/templates/partials/attributes-tab.html",
	];

	// Load the template parts
	return loadTemplates(templatePaths);
};
