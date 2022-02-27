import axios from 'axios';

import { showToast } from './toast';
import { toastContainerEl } from '.';
export async function loadSections() {
	const sectionTableEl = document.getElementById('section__table');
	sectionTableEl.innerHTML = '';
	try {
		const data = (await axios.get('/sections')).data;
		data
			.map((section) => {
				return generateHtmlItem(
					section.id,
					section.keyword,
					section.status,
					section.jobs,
					section.updatedAt,
					section.createdAt
				);
			})
			.forEach((template) => {
				sectionTableEl.insertAdjacentHTML('beforeend', template);
			});
	} catch (err) {
		showToast(toastContainerEl, 'Không thể tải danh sách section vì lý do nào đó', 'danger');
		console.error(err);
	}
}

function generateHtmlItem(id, keyword, status, numOfJob, updatedAt, createdAt) {
	return `<tr class="history-item"
        data-id="${id}">
        <td class="history-item-id">#${id}</td>
        <td class="history-item-keyword">${keyword}</td>
        <td class="history-item-status">${status}</td>
        <td class="history-item-status">${numOfJob}</td>
        <td class="history-item-updated_at">${reformatDate(updatedAt)}</td>
        <td class="history-item-created_at">${reformatDate(createdAt)}</td>
        <td><button class="btn btn-success btn-sm analyze__btn"
                    data-id="${id}">Analyze</button></td>
    </tr>`;
}

function reformatDate(dateStr) {
	const date = new Date(dateStr);
	return date.toLocaleDateString('vi-VN');
}
