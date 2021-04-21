import Reddit from 'reddit-wrapper-v2';

export default Reddit({
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
	app_id: 'cF2q0GY8vlSU5w',
	api_secret: process.env.SUWP_SECRET,
	logs: true,
	retry_delay: 1,
	retry_on_server_error: 10,
	retry_on_wait: true,
	user_agent: `u/${process.env.REDDIT_USERNAME} - Steven Universe Wallpapers Scraper`,
}).api;