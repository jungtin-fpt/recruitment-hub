export const getLaunchBrowserOption = function (
	env: string,
	windowWidth: number,
	windowHeight: number,
	headless: boolean
) {
	if (env === 'production')
		return {
			executablePath: '/usr/bin/chromium',
			headless,
			defaultViewport: null,
			devtools: false,
			args: [`--window-size=${windowWidth},${windowHeight}`, '--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
		};

	return {
		headless,
		defaultViewport: null,
		devtools: false,
		args: [`--window-size=${windowWidth},${windowHeight}`],
	};
};
