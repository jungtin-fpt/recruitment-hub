/* eslint-disable no-extra-boolean-cast */
/* eslint-disable indent */
/* eslint-disable quotes */
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import * as $ from 'jquery';

import { showToast } from './toast';
import { loadSections } from './section';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { analyze } from './analyze';

export const toastContainerEl = document.getElementById('toast-container');
export const crawlerStatusEl = document.getElementById('crawler-status__value');
export const crawlBtnEl = document.getElementById('crawl__btn');
export const topCvLogContainer = document.getElementById('topcv-crawler__log-container');
export const kwInputEl = document.getElementById('keyword__input');

export const exportPdfBtn = document.getElementById('export-pdf__btn');
export const exportPdfContainer = document.getElementById('export-pdf__container');

export const companyTableEl = document.getElementById('analyze__company-table');
export const levelTableEl = document.getElementById('analyze__level-table');
export const regionTableEl = document.getElementById('analyze__region-table');
export const salaryTableEl = document.getElementById('analyze__salary-table');
export const skillTableEl = document.getElementById('analyze__skill-table');
export const suggestedSkillTableEl = document.getElementById('analyze__suggest-skill-table');
export const workMethodTableEl = document.getElementById('analyze__work-method-table');
export const regionChartEl = document.getElementById('regionChart');
export const skillChartEl = document.getElementById('skillChart');
export const suggestedSkillChartEl = document.getElementById('suggestedSkillChart');
export const salaryChartEl = document.getElementById('salaryChart');
export const levelChartEl = document.getElementById('levelChart');
export const workMethodChartEl = document.getElementById('workMethodChart');

/* Events */
crawlBtnEl.addEventListener('click', async (e) => {
	const kw = kwInputEl.value;
	if (!kw || kw?.trim() === '') {
		alert('Keyword phải được điền trước khi thực hiện crawling');
		kwInputEl.value = '';
		return;
	}

	try {
		await axios.post('/crawler', {
			keyword: kw,
		});
	} catch (err) {
		showToast(toastContainerEl, 'Đã có lỗi xảy ra khi thực hiện crawling', 'danger');
	}
});

$(document).on('click', '.analyze__btn', analyze);

exportPdfBtn.addEventListener('click', (e) => {
	html2pdf()
		.set({
			filename: 'crawler_export.pdf',
		})
		.from(exportPdfContainer)
		.save();
});

/* Event Source */
if (!!window.EventSource) {
	const source = new EventSource('/events');
	source.addEventListener(
		'default',
		function (e) {
			const { type, level, data } = JSON.parse(e.data);
			const message = type === 'object' ? JSON.stringify(JSON.parse(data), null, 4) : data;
			showToast(toastContainerEl, message, 'info');
		},
		false
	);

	source.addEventListener(
		'status',
		async function (e) {
			if (e.data === 'true') {
				crawlerStatusEl.classList.remove('text-danger');
				crawlerStatusEl.classList.add('text-success');
				crawlerStatusEl.innerText = 'Available';
				crawlBtnEl.disabled = false;
				await loadSections();
			} else {
				crawlerStatusEl.classList.remove('text-success');
				crawlerStatusEl.classList.add('text-danger');
				crawlerStatusEl.innerText = 'On Progress';
				crawlBtnEl.disabled = true;
			}
		},
		false
	);

	source.addEventListener('topcv-event', crawlerEventFunction(topCvLogContainer), false);

	source.addEventListener(
		'open',
		(e) => {
			console.log('Open');
		},
		false
	);

	source.addEventListener(
		'error',
		function (e) {
			const id_state = document.getElementById('state');
			if (e.eventPhase == EventSource.CLOSED) source.close();

			if (e.target.readyState == EventSource.CLOSED) {
				console.log('Disconnected');
			} else if (e.target.readyState == EventSource.CONNECTING) {
				console.log('Connecting');
			}
		},
		false
	);
} else {
	console.error(`Your browser doesn't supports SSE(server-sent event)`);
	alert(`Your browser doesn't supports SSE(server-sent event)`);
}

(async () => {
	showToast(
		toastContainerEl,
		'Xin chào bạn, cám ơn bạn đã truy cập vào website. Tất cả những thông báo từ server sẽ được hiển thị tại đây',
		'secondary'
	);
	await loadSections();
})();

function crawlerEventFunction(loggerContainer) {
	return function (e) {
		try {
			const { type, level, data } = JSON.parse(e.data);
			const message = type === 'object' ? JSON.stringify(JSON.parse(data), null, 4) : data;
			loggerContainer.insertAdjacentHTML('beforeend', generateHtmlLog(message, level));
			loggerContainer.scrollTop = loggerContainer.scrollHeight;
		} catch (err) {
			console.error('Fail to parse message from [TOPCV] server', err);
		}
	};
}

function generateHtmlLog(log, status) {
	switch (status) {
		case 'info':
			return `<p>${log}</p>`;
		case 'warn':
			return `<p class="text-warning">${log}</p>`;
		case 'error':
			return `<p class="text-danger">${log}</p>`;
		default:
			return `<p>${log}</p>`;
	}
}
