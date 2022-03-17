import puppeteer, { Browser, Page } from 'puppeteer';
import { CompanyDTO } from '../company/company.dto';
import config from '../config';
import { JobDetailViecLam365DTO } from '../job/job-detail-vieclam365.dto';
import { JobDetailDTO } from '../job/job-detail.dto';
import { JobOverallDTO } from '../job/job-overall.dto';
import logger from '../logger';
import AbstractCrawler from './crawler.abstract';
import { getLaunchBrowserOption } from './crawler.helper';

export default class Vieclam365Crawler extends AbstractCrawler {
	async crawl(
		keyword: string,
		headless: boolean = true,
		baseUrl: string = 'https://timviec365.vn/',
		searchUrl: string = 'https://timviec365.vn/'
		//searchUrl: string = 'https://timviec365.vn/tin-tuyen-dung-viec-lam.html'
	): Promise<JobDetailDTO[]> {
		try {
			const jobDetails: JobDetailDTO[] = [];
			var startTime = Date.now();
			this.log(
				'info',
				`Vieclam365 Crawler: has just started and crawling for keyword: ${keyword} - URL: ${baseUrl}`
			);

			const browser = await this.launchBrowser(baseUrl, headless);
			let page = await this.goto(browser, searchUrl);
			page = await this.search(page, keyword);
			//const totalPage = await this.getTotalPageNumber(page);
			//const totalPage = 12;
			const jobs = await this.crawlAllJobs(page);
			for (let i = 0; i < jobs.length; i++) {
				const job: JobOverallDTO = jobs[i];
				try {
					page = await this.goto(browser, job.url, page);
					let detail!: JobDetailDTO;
					detail = await this.crawlJobDetail(keyword, page, job);
					// else if (job.url.includes('topcv.vn/brand'))
					// 	detail = await this.crawlJobDetailForBrandPage(page, job);

					if (detail) {
						this.log('info', 'Job crawling completed successfully:');
						this.log('info', detail);
						jobDetails.push(detail);
					}
				} catch (err) {
					this.log(
						'error',
						`TimViec365 Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`
					);
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

	async launchBrowser(
		baseUrl: string,
		headless: boolean = false,
		windowWidth: number = 1200,
		windowHeight: number = 800
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
			throw new Error('Vieclam365 Crawler - Fail to launch browser');
		}
	}

	async goto(browser: Browser, url: string, page?: Page): Promise<Page> {
		try {
			if (!page) page = await browser.newPage();
			await page.goto(url, { waitUntil: 'networkidle2' });
			this.log('info', `Go to page: ${url}`);
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`Vieclam365 Crawler - Fail to goto page: ${url}`);
		}
	}

	async search(page: Page, keyword: string): Promise<Page> {
		try {
			await page.waitForSelector('input#fts_id');
			await page.type('input#fts_id', keyword);
			await page.keyboard.press('Enter');
			// await page.waitForNavigation({
			// 	waitUntil: 'networkidle2'
			// });

			this.log('info', `Searching: ${keyword}`);
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`Vieclam365 Crawler - Fail to search: ${keyword}`);
		}
	}

	async getTotalPageNumber(page: Page): Promise<number> {
		try {
			await page.waitForSelector('div.pagination_wrap');
			const pagination = await page.$('div.pagination_wrap div.clr');
			//const totalPages = await page.$('div.pagination_wrap div.clr a.next');
			if (pagination) {
				//let totalPage = 1;

				const lastItems = await pagination.$('a:last-child');
				await lastItems?.click();
				await page.waitForSelector('div.pagination_wrap div.clr');
				const paginationTmp = await page.$('div.pagination_wrap div.clr');
				const lastPageEl = await paginationTmp?.$('a.jp-current');
				if (lastPageEl) {
					return Number.parseInt(await lastPageEl.evaluate((el) => (el as HTMLElement).innerText));
				}

				// const lastPageEl = listItems[listItems.length - 2];
				// return Number.parseInt(await lastPageEl.evaluate((el) => (el as HTMLElement).innerText));

				// while(await page.$('div.pagination_wrap div.clr a.next')){
				// 	await page.click('div.pagination_wrap div.clr a.next');
				// 	totalPage ++;
				// }
				// return totalPage;
			}

			return 1;
		} catch (err) {
			logger.error(err);
			throw new Error(`TimViec365 Crawler - Fail to get total page number`);
		}
	}

	async goNextPage() {}

	async crawlAllJobs(page: Page, totalPage?: number): Promise<JobOverallDTO[]> {
		try {
			let isNextPage = false;
			const arrJobs: JobOverallDTO[] = [];
			let currentPage: string | undefined;

			const isEmptyEl = await page.$('div.pagination_wrap div.clr a');
			const checkNull = await isEmptyEl?.evaluate((el) => (el as HTMLElement).innerText);
			if (checkNull === '') {
				this.log('info', `Crawl All Job - There's no result that match with your keyword`);
				return [];
			}

			do {
				await page.waitForSelector('div.pagination_wrap');
				const pagination = await page.$('div.pagination_wrap div.clr');

				if (!pagination) this.log('info', `Crawl All Job - Page: 1(No pagination) processing...`);
				else {
					const currentPageEl = await pagination.$('a.jp-current');
					currentPage = await currentPageEl?.evaluate((el) => (el as HTMLElement).innerText);
					this.log('info', `Page: ${currentPage}/${totalPage || '_'} processing...`);
				}

				const jobs = await page.$$('div.item_cate');
				this.log('info', `Crawl All Job - Page ${currentPage} - Total: ${jobs.length} jobs`);

				const jobInfos = await Promise.all(
					jobs.map(async (job) => {
						const jobInfo = await job.evaluate((el) => {
							const baseURL: string = 'https://timviec365.vn';
							const wrapperEl = el.querySelector('div.center_cate_l h3');
							const urlEl = wrapperEl?.querySelector('a.title_cate');
							const titleEl = wrapperEl?.querySelector('a.title_cate');

							const url = urlEl ? baseURL + urlEl.getAttribute('href') : '';
							const title = titleEl ? titleEl.getAttribute('title') : '';

							// return new Job(url, title);
							return { url, title } as JobOverallDTO;
						});
						console.log(jobInfo);

						this.log('info', jobInfo);
						return jobInfo;
					})
				);

				arrJobs.push(...jobInfos);

				let nextBtnEl;
				if (pagination) {
					try {
						nextBtnEl = await pagination.$('a.next');
						if (!nextBtnEl) throw new Error('Không tìm thấy next page');
						isNextPage = await nextBtnEl.evaluate((el) => el.classList.contains('next'));
					} catch {
						isNextPage = false;
					}
				}

				if (nextBtnEl && isNextPage) {
					const data = await nextBtnEl.evaluate((e) => e.getAttribute('href'));
					console.log(data);
					if (data) await page.goto('https://timviec365.vn' + data);
				}

				// let nextPageEl;
				// if (pagination) {
				// 	nextPageEl = await pagination.$("a[title='Next page']");
				// 	if (!nextPageEl) throw new Error('Không tìm thấy next page');

				// 	isNextPage = (await nextPageEl.evaluate((el) => (((el.classList.contains('next'))))));
				// }

				// if (isNextPage && nextPageEl) {
				// 	await pagination?.waitForSelector('a.next');
				// 	await nextPageEl.click();
				// 	await page.waitForNavigation({
				// 		waitUntil: 'networkidle2'
				// 	});
				// }
				// else await page.close();
			} while (isNextPage);

			return arrJobs;
		} catch (err) {
			logger.error(err);
			this.log('error', `TimViec365 Crawler - Fail to crawl all jobs`, true);
			throw new Error(`TimViec365 Crawler - Fail to crawl all jobs`);
		}
	}

	async crawlJobDetail(keyword: string, page: Page, job: JobOverallDTO): Promise<JobDetailDTO> {
		try {
			await page.waitForSelector('div.box_tit_detail');
			const companyLinkTmp =
				(await page.$eval('div.left_tit a.ct_com', (el) =>
					(el as HTMLElement).getAttribute('href')
				)) || '';
			let companyLink = '';
			if (companyLinkTmp !== '') {
				companyLink = 'https://timviec365.vn' + companyLinkTmp;
			}
			const region = await page.$eval('p.dd_tuyen a', (el) => (el as HTMLElement).innerText);
			const workAddress =
				(await page.$eval(
					'div.right_tit p:nth-child(6) span',
					(el) => (el as HTMLElement).innerText
				)) || '';
			const salary =
				(await page.$eval(
					'div.right_tit_2 p.lv_luong span',
					(el) => (el as HTMLElement).innerText
				)) || '';
			const level =
				(await page.$eval(
					'div.box_tomtat_2 p:first-child span',
					(el) => (el as HTMLElement).innerText
				)) || '';
			const workMethod =
				(await page.$eval(
					'div.box_tomtat_2 p:nth-child(3) span',
					(el) => (el as HTMLElement).innerText
				)) || '';
			// const skills = await page.$$eval('div.skill span', (els) => {
			// 	return (els as HTMLElement[])
			// 		.filter((el) => {
			// 			return !!el.querySelector('a')?.innerText;
			// 		})
			// 		.map((el) => {
			// 			return el.querySelector('a')?.innerText || '';
			// 		});
			// });
			const skills: string[] = [keyword];
			const description =
				(await page.$eval('div.box_yeucau', (el) => (el as HTMLElement).innerText)) || '';

			//const descriptionTmp2 = descriptionTmp1.split('\n');
			// const description =
			// 	(await page.$eval('div.job-data h3', (els) => {
			// 		const el = (els as HTMLElement[]).filter(
			// 			(title) => title.innerText === 'Yêu cầu ứng viên'
			// 		)[0];
			// 		const contentTabEl = el.nextElementSibling;
			// 		const items = contentTabEl?.querySelectorAll('ul li');
			// 		const paragraphItems = contentTabEl?.querySelectorAll('p');
			// 		let description = '';
			// 		items?.forEach((item) => {
			// 			description += ` ${item.textContent} `;
			// 		});
			// 		paragraphItems?.forEach((item) => {
			// 			description += ` ${item.textContent} `;
			// 		});
			// 		return description;
			// 	})) || '';
			const requiredExp =
				(await page.$eval(
					'div.box_tomtat_2 p:nth-child(2) span',
					(el) => (el as HTMLElement).innerText
				)) || '';

			// console.log(`Job title: ${job.title}`);
			// console.log(`Job link: ${job.url}`);
			// console.log(`Company link: ${companyLink}`);
			// console.log(`Raw region: ${rawRegion}`);
			// console.log(`Work address: ${workAddress}`);
			// console.log(`Raw salary: ${rawSalary}`);
			// console.log(`Level: ${rawLevel}`);
			// console.log(`Work method: ${rawWorkMethod}`);
			// console.log(`Skills: ${skills.length}`);
			// skills.forEach(skill => {
			// 	console.log(skill);
			// })
			// console.log(`Description: ${description}`);
			const company = await this.crawlCompany(page, companyLink);
			const jobDetailRaw = new JobDetailViecLam365DTO(
				job.url,
				job.title,
				description,
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
				`TimViec365 Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`,
				true
			);
			throw new Error(`TimViec365 Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
		}
	}

	async crawlCompany(page: Page, companyLink: string): Promise<CompanyDTO> {
		try {
			await page.goto(companyLink);
			await page.waitForSelector('div.name_cty');
			const companyName = await page.$eval(
				'div.name_cty a p',
				(el) => (el as HTMLElement).innerText
			);
			const companyAddress = await page.$eval(
				'div.text_ntd_2 span',
				(el) => (el as HTMLElement).innerText
			);
			const companyImageUrl =
				(await page.$eval('div.anh_cty a img', (el) => (el as HTMLElement).getAttribute('src'))) ||
				'';
			// await page.close();

			return new CompanyDTO(companyLink, companyName, companyAddress, companyImageUrl);
		} catch (err) {
			logger.error(err);
			this.log('error', `TimViec365 Crawler - Fail to crawl company: ${companyLink}`, true);
			throw new Error(`TimViec365 Crawler - Fail to crawl company: ${companyLink}`);
		}
	}
}
