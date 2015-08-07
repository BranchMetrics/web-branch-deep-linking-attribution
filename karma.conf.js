module.exports = function(config) {
	config.set({
		browserStack: {
			username: BROWSER_STACK_USERNAME,
			accessKey: BROWSER_STACK_ACCESS_KEY
		}

		customLaunchers: {
			bs_firefox_mac: {
				base: 'BrowserStack',
				browser: 'firefox',
				browser_version: '21.0',
				os: 'OS X',
				os_version: 'Mountain Lion'
			},
			bs_iphone5: {
				base: 'BrowserStack',
				device: 'iPhone 5',
				os: 'ios',
				os_version: '6.0'
			}
		},

		browsers: ['bs_firefox_mac', 'bs_iphone5']
	});
};
