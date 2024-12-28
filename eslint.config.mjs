import js from "@eslint/js";

export default [
	{ignores: ["scripts/**/*.js", "scripts/**/*.mjs"]},
	js.configs.recommended,
	{
		files: ["**/*.js"],
		languageOptions: {
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module"
			}
		},
		rules: {
			"no-undef": 0,
			"no-unused-vars": [
				"error",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true
				}
			]
		},
		linterOptions: {
			reportUnusedDisableDirectives: "error"
		}
	}
];
