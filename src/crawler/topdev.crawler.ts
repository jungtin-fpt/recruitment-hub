import puppeteer, { Browser, Page } from 'puppeteer';
import { CompanyDTO } from '../company/company.dto';
import config from '../config';
import { JobDetailTopDevDTO } from '../job/job-detail-topdev.dto';
import { JobDetailDTO } from '../job/job-detail.dto';
import { JobOverallDTO } from '../job/job-overall.dto';
import logger from '../logger';
import AbstractCrawler from './crawler.abstract';
import { getLaunchBrowserOption } from './crawler.helper';

export default class TopDevCrawler extends AbstractCrawler {
	async crawl(
		keyword: string,
		headless: boolean = true,
		baseUrl: string = 'https://topdev.vn/',
		searchUrl: string = 'https://topdev.vn/viec-lam-it'
	): Promise<JobDetailDTO[]> {
		try {
			const jobDetails: JobDetailDTO[] = [];
			var startTime = Date.now();
			this.log(
				'info',
				`TopDev Crawler: has just started and crawling for keyword: ${keyword} - URL: ${baseUrl}`
			);

			const browser = await this.launchBrowser(baseUrl, headless);
			let page = await this.goto(browser, 'https://accounts.topdev.vn/');

			page = await this.login(page);
			await page.waitForTimeout(5000);
			page = await this.goto(browser, searchUrl);
			await page.waitForTimeout(3000);
			// page = await this.goto(browser, searchUrl);
			// await page.waitForTimeout(2000);

			page = await this.search(page, keyword);
			const jobs = await this.crawlAllJobs(page);
			for (let i = 0; i < jobs.length; i++) {
				const job: JobOverallDTO = jobs[i];
				try {
					page = await this.goto(browser, job.url, page);
					let detail!: JobDetailDTO;
					detail = await this.crawlJobDetail(page, job);

					if (detail) {
						this.log('info', 'Job crawling completed successfully:');
						this.log('info', detail);
						jobDetails.push(detail);
					}
				} catch (err) {
					this.log('error', `TopCV Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
				}
			}
			await browser.close();
			var endTime = Date.now();
			this.log(
				'info',
				`Crawling process comleted in ${Math.round((endTime - startTime) / 1000)} seconds `
			);
			return jobDetails;
		} catch (err) {
			logger.error(err);
			throw new Error(`Error when crawling website: ${baseUrl} - ${searchUrl}`);
		}
	}

	//  LAUNCH
	async launchBrowser(
		baseUrl: string,
		headless: boolean = false,
		windowWidth: number = 1300,
		windowHeight: number = 900
	): Promise<Browser> {
		try {
			const browser = await puppeteer.launch(
				getLaunchBrowserOption(config.env, windowWidth, windowHeight, headless)
			);
			const context = browser.defaultBrowserContext();
			context.overridePermissions(baseUrl, ['geolocation', 'notifications']);

			this.log('info', 'Opening browser');
			return browser;
		} catch (err) {
			logger.error(err);
			throw new Error('TopDev Crawler - Fail to launch browser');
		}
	}
	// GOTO
	async goto(browser: Browser, url: string, page?: Page): Promise<Page> {
		try {
			if (!page) page = await browser.newPage();
			await page.goto(url, { waitUntil: 'networkidle2' });
			this.log('info', `Go to page: ${url}`);
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`TopDev Crawler - Fail to goto page: ${url}`);
		}
	}
	// LOGIN
	async login(page: Page): Promise<Page> {
		try {
			await page.waitForSelector('a#nav-employer-tab');
			await page.click('a#nav-employer-tab');
			await page.waitForTimeout(1000);
			await page.waitForSelector(
				'#nav-employer > div > div.col-sm-12.col-lg-5.td_col-left.td_col > div > form > div:nth-child(2) > input'
			);
			await page.type(
				'#nav-employer > div > div.col-sm-12.col-lg-5.td_col-left.td_col > div > form > div:nth-child(2) > input',
				'taintse140073@fpt.edu.vn'
			);
			await page.waitForSelector(
				'#nav-employer > div > div.col-sm-12.col-lg-5.td_col-left.td_col > div > form > div:nth-child(3) > input'
			);
			await page.type(
				'#nav-employer > div > div.col-sm-12.col-lg-5.td_col-left.td_col > div > form > div:nth-child(3) > input',
				'78945613qE'
			);
			await page.waitForTimeout(3000);
			await page.waitForSelector(
				'#nav-employer > div > div.col-sm-12.col-lg-5.td_col-left.td_col > div > form > button'
			);
			await page.click(
				'#nav-employer > div > div.col-sm-12.col-lg-5.td_col-left.td_col > div > form > button'
			);

			this.log('info', 'Logging in');
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`TopDev Crawler - Fail to login`);
		}
	}
	// SEARCH
	async search(page: Page, keyword: string): Promise<Page> {
		try {
			await page.waitForSelector('#gnb ul li.main-button.user_logged ul li.user');
			await page.waitForSelector('#myTags span.autocomplete input');
			await page.type('#myTags span.autocomplete input', keyword);
			await page.keyboard.press('Enter');
			await page.waitForTimeout(3000);
			this.log('info', `Searching: ${keyword}`);
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`TopDev Crawler - Fail to search: ${keyword}`);
		}
	}
	// CRAWL JOB LIST
	async crawlAllJobs(page: Page): Promise<JobOverallDTO[]> {
		try {
			const arrJobs: JobOverallDTO[] = [];

			const isEmptyEl = await page.$('div.card.list_search_has_kw.search_non_data');
			if (!!isEmptyEl) {
				this.log('info', `Crawl All Job - There's no result that match with your keyword`);
				return [];
			}
			await page.waitForSelector('#scroll-it-jobs');
			await page.waitForSelector('#list_search_has_kw > ul > p > button');

			while (await page.$('#list_search_has_kw > ul > p > button')) {
				await page.waitForSelector('#list_search_has_kw > ul > p > button');

				page.evaluate((btnSelector) => {
					document.querySelector(btnSelector).click();
				}, '#list_search_has_kw > ul > p > button');

				await page.waitForTimeout(1000);
			}
			const jobs = await page.$$('#scroll-it-jobs');
			this.log('info', `Crawl All Job | Total: ${jobs.length} jobs`);

			const jobInfos = await Promise.all(
				jobs.map(async (job) => {
					const jobInfo = await job.evaluate((el) => {
						const wrapperEl = el.querySelector('#scroll-it-jobs > div > div.cont > h3');
						const urlEl = wrapperEl?.querySelector('#scroll-it-jobs > div > div.cont > h3 > a');
						const titleEl = wrapperEl?.querySelector('#scroll-it-jobs > div > div.cont > h3 > a');

						const tempurl = urlEl ? urlEl.getAttribute('href') : '';
						let title: string = titleEl?.textContent ? titleEl.textContent : '';
						title = title?.replace('HOT', '');
						title = title?.replaceAll(/\\n/gi, '');
						title = title.trim();

						const url = 'https://topdev.vn' + tempurl;
						// this.log('info',url);
						// return new Job(url, title);
						return { url, title } as JobOverallDTO;
					});
					this.log('info', jobInfo);
					return jobInfo;
				})
			);
			arrJobs.push(...jobInfos);

			return arrJobs;
		} catch (err) {
			logger.error(err);
			this.log('error', `TopDev Crawler - Fail to crawl all jobs`, true);
			throw new Error(`TopDev Crawler - Fail to crawl all jobs`);
		}
	}
	//CRAWL DETAIL of JOB
	async crawlJobDetail(page: Page, job: JobOverallDTO): Promise<JobDetailDTO> {
		try {
			await page.waitForTimeout(3000);
			await page.waitForSelector('#about_company > h1');
			this.log('info', `Job title: ${job.title}`);
			this.log('info', `Job link: ${job.url}`);
			//url
			await page.waitForSelector('div.box.about-comp > div > div > a');
			const tempcompanyLink =
				(await page.$eval('div.box.about-comp > div > div > a', (el) =>
					(el as HTMLElement).getAttribute('href')
				)) || '';
			const companyLink = 'https://topdev.vn' + tempcompanyLink;
			this.log('info', `Company link: ${companyLink}`);

			// Adress
			await page.waitForSelector(
				'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > div:nth-child(3) > p'
			);
			const workAddress = await page.$eval(
				'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > div:nth-child(3) > p',
				(el) => (el as HTMLElement).innerText
			);
			this.log('info', `Work address: ${workAddress}`);
			// region
			let tempRegion = '';
			if (workAddress.includes('Hồ Chí Minh')) {
				tempRegion = ' Hồ Chí Minh';
			} else if (workAddress.includes('Hà Nội')) {
				tempRegion = 'Hà Nội';
			} else if (workAddress.includes('Đà Nẵng')) {
				tempRegion = 'Đà Nẵng';
			} else {
				tempRegion = 'viet nam';
			}
			const region = tempRegion;
			this.log('info', `Raw region: ${region}`);
			//salary
			await page.waitForSelector(
				'#about_company > div.mb-3.job-salary-view.custom_salary_job_detail.js-job-salary-view > span'
			);
			const salary =
				(await page.$eval(
					'#about_company > div.mb-3.job-salary-view.custom_salary_job_detail.js-job-salary-view > span',
					(el) => (el as HTMLElement).innerText
				)) || '';
			this.log('info', `Raw salary: ${salary}`);
			//level
			await page.waitForSelector(
				'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > p:nth-child(7)'
			);
			const level =
				(await page.$eval(
					'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > p:nth-child(7)',
					(el) => (el as HTMLElement).innerText
				)) || '';
			this.log('info', `Level: ${level}`);
			//work method
			await page.waitForSelector(
				'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > div:nth-child(9) > div > div > a > span'
			);
			const workMethod =
				(await page.$eval(
					'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > div:nth-child(9) > div > div > a > span',
					(el) => (el as HTMLElement).innerText
				)) || '';
			this.log('info', `Work method: ${workMethod}`);
			//skill
			await page.waitForSelector(
				'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > div.mb-3.lang-badge-light.job-bottom.custom__over_hidden > div > a'
			);
			const skills = await page.$$eval(
				'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > div.mb-3.lang-badge-light.job-bottom.custom__over_hidden > div > a',
				(els) => {
					return (els as HTMLElement[])
						.filter((el) => {
							return !!el.querySelector('span')?.innerText;
						})
						.map((el) => {
							return el.querySelector('span')?.innerText || '';
						});
				}
			);
			this.log('info', `Skills:`);
			this.log('info', skills);
			//description
			await page.waitForSelector('#about_company');

			const rawDesc = await page.$$eval('#about_company div h2 p b', (els) => {
				const descEl = els.filter((el) => el.textContent === 'Kỹ năng & Chuyên môn:')[0];
				if (!descEl) return '';

				const parentDiv = descEl.parentElement?.parentElement?.parentElement;
				const liEls = parentDiv?.querySelectorAll('div ul li span');
				let description = '';
				liEls?.forEach((el) => {
					description += el.textContent;
				});
				return description;
			});
			this.log('info', `Description: ${rawDesc}`);

			// Exp
			await page.waitForSelector(
				'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > p:nth-child(5)'
			);
			const requiredExp =
				(await page.$eval(
					'#slide-wrap-length > div.right-cont > div.fixed_scroll > div:nth-child(2) > p:nth-child(5)',
					(el) => (el as HTMLElement).innerText
				)) || '';
			this.log('info', `Exp: ${requiredExp}`);

			//company
			const company = await this.crawlCompany(page, companyLink);

			const jobDetailRaw = new JobDetailTopDevDTO(
				job.url,
				job.title,
				rawDesc,
				region,
				salary,
				workMethod,
				workAddress,
				level,
				skills,
				company,
				requiredExp
			);

			return jobDetailRaw.reformat();
		} catch (err) {
			logger.error(err);
			this.log(
				'error',
				`TopCV Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`,
				true
			);
			throw new Error(`TopCV Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
		}
	}
	// CRAWL COMPANY SITE
	async crawlCompany(page: Page, companyLink: string): Promise<CompanyDTO> {
		try {
			await page.goto(companyLink);
			await page.waitForTimeout(3000);
			await page.waitForSelector(
				'#scroll_loading_detail > div > div > div.col-12.col-xl-9.leftside > div > div.box.about-comp > div > div > h1'
			);
			const companyName = await page.$eval(
				'#scroll_loading_detail > div > div > div.col-12.col-xl-9.leftside > div > div.box.about-comp > div > div > h1',
				(el) => (el as HTMLElement).innerText
			);
			await page.waitForSelector(
				'#scroll_loading_detail > div > div > div.col-12.col-xl-3.rightside > div > div:nth-child(4) > p:nth-child(1)'
			);
			const companyAddress = await page.$eval(
				'#scroll_loading_detail > div > div > div.col-12.col-xl-3.rightside > div > div:nth-child(4) > p:nth-child(1)',
				(el) => (el as HTMLElement).innerText
			);
			await page.waitForSelector(
				'#scroll_loading_detail > div > div > div.col-12.col-xl-9.leftside > div > div.box.about-comp > div > p > img'
			);
			const companyImageUrl =
				(await page.$eval(
					'#scroll_loading_detail > div > div > div.col-12.col-xl-9.leftside > div > div.box.about-comp > div > p > img',
					(el) => (el as HTMLElement).getAttribute('src')
				)) || '';
			// await page.close();

			return new CompanyDTO(companyLink, companyName, companyAddress, companyImageUrl);
		} catch (err) {
			logger.error(err);
			this.log('error', `TopCV Crawler - Fail to crawl company: ${companyLink}`, true);
			throw new Error(`TopCV Crawler - Fail to crawl company: ${companyLink}`);
		}
	}
}
