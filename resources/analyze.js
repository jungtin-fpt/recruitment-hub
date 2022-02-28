import axios from 'axios';
import Chart from 'chart.js/auto';
import * as bootstrap from 'bootstrap';

import {
	companyTableEl,
	regionTableEl,
	levelTableEl,
	salaryTableEl,
	skillTableEl,
	suggestedSkillTableEl,
	workMethodTableEl,
	regionChartEl,
	skillChartEl,
	suggestedSkillChartEl,
	levelChartEl,
	salaryChartEl,
	workMethodChartEl,
	toastContainerEl,
} from '.';

import { showToast } from './toast';

const modalEl = document.getElementById('modal'); // Không thể đặt bên index.js vì can't use before init

let regionChart, skillChart, suggestedSkillChart, salaryChart, levelChart, workMethodChart;

const myModal = new bootstrap.Modal(modalEl);

document.addEventListener('DOMContentLoaded', (event) => {
	modalEl.addEventListener('hidden.bs.modal', function (event) {
		regionChart.destroy();
		skillChart.destroy();
		suggestedSkillChart.destroy();
		salaryChart.destroy();
		levelChart.destroy();
		workMethodChart.destroy();
	});
});

export async function analyze(e) {
	const id = e.target.getAttribute('data-id');
	try {
		const {
			regionMap,
			levelMap,
			workMethodMap,
			skillMap,
			suggestedSkillMap,
			companyMap,
			salaryStateMap,
		} = (
			await axios.post('/analyze', {
				sectionId: parseInt(id),
			})
		).data;

		insertToRowToTable(companyTableEl, companyMap);
		insertToRowToTable(regionTableEl, regionMap);
		insertToRowToTable(levelTableEl, levelMap);
		insertToRowToTable(salaryTableEl, salaryStateMap);
		insertToRowToTable(skillTableEl, skillMap);
		insertToRowToTable(suggestedSkillTableEl, suggestedSkillMap);
		insertToRowToTable(workMethodTableEl, workMethodMap);

		const regionChartData = convertChartData(regionMap);
		const skillChartData = convertChartData(skillMap);
		const suggestedSkillChartData = convertChartData(suggestedSkillMap);
		const levelChartData = convertChartData(levelMap);
		const workMethodChartData = convertChartData(workMethodMap);
		const salaryChartData = convertChartData(salaryStateMap);

		regionChart = initChart(
			regionChartEl,
			'polarArea',
			'Biểu đồ phân bố công việc ở các vùng miền',
			regionChartData
		);
		skillChart = initChart(
			skillChartEl,
			'bar',
			'Biểu đồ kĩ năng cần có khi ứng tuyển',
			skillChartData
		);
		suggestedSkillChart = initChart(
			suggestedSkillChartEl,
			'bar',
			'Biểu đồ kĩ năng cần có khi ứng tuyển (gợi ý bởi hệ thống phân tích)',
			suggestedSkillChartData
		);
		levelChart = initChart(levelChartEl, 'polarArea', 'Biểu đồ phân bố cấp bậc', levelChartData);
		salaryChart = initChart(
			salaryChartEl,
			'polarArea',
			'Biểu đồ phân bố mức lương',
			salaryChartData
		);
		workMethodChart = initChart(
			workMethodChartEl,
			'polarArea',
			'Biểu đồ phân bố phương thức làm việc',
			workMethodChartData
		);

		myModal.show();
	} catch (err) {
		console.error(err);
		showToast(toastContainerEl, 'Đã có lỗi xảy ra khi phân tích & tạo report', 'danger');
	}
}

function initChart(element, type, label, chartData) {
	return new Chart(element, {
		type,
		data: {
			labels: chartData.labels,
			datasets: [
				{
					label,
					data: chartData.data,
					backgroundColor: chartData.colors,
				},
			],
		},
		options: {},
	});
}

function convertChartData(map) {
	const labels = [];
	const data = [];
	const colors = [];
	for (const [key, value] of Object.entries(map)) {
		labels.push(key);
		data.push(value);
		colors.push(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
	}
	return {
		labels,
		data,
		colors,
	};
}

function insertToRowToTable(tableEl, object) {
	for (const [key, value] of Object.entries(object)) {
		tableEl.insertAdjacentHTML(
			'beforeend',
			`<tr>
			<td>${key}</td>
			<td>${value}</td>
		</tr>`
		);
	}
}
