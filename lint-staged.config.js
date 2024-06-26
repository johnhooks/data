module.exports = {
	// '**/*.(ts|tsx)': () => '@todo need a command to type check',
	'**/*.(json|yml|yaml)': (filenames) => {
		const files = filenames.join(' ');
		return [`prettier --write ${files}`];
	},
	'**/*.(js|jsx|cjs|mjs|ts|tsx)': (filenames) => {
		const files = filenames.join(' ');
		return [`eslint --ext .js,.jsx,.cjs,.mjs,.ts,.tsx --fix ${files}`];
	},
};
