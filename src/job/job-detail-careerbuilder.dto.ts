import { CompanyDTO } from '../company/company.dto';
import logger from '../logger';
import { removeSpecialCharacter, removeVNAccent } from '../util/formatter';
import { JobDetailDTO } from './job-detail.dto';
import { LEVEL } from './utils/level';
import { Salary } from './utils/salary';
import { WORK_METHOD } from './utils/work-method';

export class JobDetailCareerBuilderDTO {
	constructor(
		public url: string,
		public title: string,
		public description: string,
		public region: string,
		public salary: string,
		public workMethod: string,
		public workAddress: string,
		public level: string,
		public skills: string[],
		public company: CompanyDTO,
		public requiredExp?: string
	) {}

	public reformat(): JobDetailDTO {
        const salary = formatSalary(this.salary);
        return new JobDetailDTO(
            this.url,
            this.title,
            this.description,
            formatRegion(this.region),
            normalizeRegion(this.region),
            formatWorkAddress(this.workAddress),
            formatWorkMethod(this.workMethod),
            formatLevel(this.level),
            this.skills,
            this.company,
            this.requiredExp,
            salary.salaryFrom,
            salary.salaryTo,
        )
    }
}

function formatRegion(region: string) {
	region = region.replace(/\-/gi, ' ');
	return region.trim();
}

function normalizeRegion(region: string) {
    region = removeVNAccent(region);
    region = removeSpecialCharacter(region, '');
    region = region.replace(/\s/gi, '-');
    region = region.toLowerCase();
	return region.trim();
}

function formatWorkMethod(workMethod: string): WORK_METHOD {
    return WORK_METHOD.FULL_TIME;
}

function formatLevel(level: string): LEVEL {
    switch(level) {
        case 'Sinh viên/ Thực tập sinh':
            return LEVEL.INTERN;
        case 'Mới tốt nghiệp':
            return LEVEL.STAFF;
        case 'Nhân viên':
            return LEVEL.STAFF;
        case 'Trưởng nhóm / Giám sát':
            return LEVEL.HEAD;
        case 'Trưởng chi nhánh':
            return LEVEL.HEAD;
        case 'Quản lý':
            return LEVEL.MANAGER;
        case 'Quản lý cấp cao':
            return LEVEL.MANAGER;
        case 'Điều hành cấp cao':
            return LEVEL.PRESIDENT;
        default:
            throw new Error(`Some job's level may not been updated yet, please take a look(${level})`);
    }
}

function formatWorkAddress(workAddress: string) {
    return workAddress.replace(/\-/gi, '').trim();
}

function formatSalary(salary: string): Salary {
    const USD_EXCHANGE_RATE = 23000;
    const VND_EXCHANGE_RATE = 1000000;

	const rawSalary = removeVNAccent(salary).toLowerCase();
	const concurrency = getSalaryConcurrency(rawSalary);
	const range = getSalaryRange(rawSalary);
    
    if(!range.isRange) {
        const sal = new Salary();
        let o;
        if(concurrency === 'usd')
            o = convertToVND(rawSalary, range.isRange, USD_EXCHANGE_RATE) as number;
        if(concurrency === 'vnd')
            o = convertToVND(rawSalary, range.isRange, VND_EXCHANGE_RATE) as number;
        if (concurrency === 'none')
            return sal;

        if(range.format === 'from')
            sal.salaryFrom = o;
        if(range.format === 'to')
            sal.salaryTo = o;
        return sal;
    }

    if(range.isRange) {
        let a;
        if (concurrency === 'usd')
            a = convertToVND(rawSalary, range.isRange, USD_EXCHANGE_RATE) as { from: number; to: number };
        if(concurrency === 'vnd')
            a = convertToVND(rawSalary, range.isRange, VND_EXCHANGE_RATE) as { from: number; to: number };
        return new Salary(a?.from, a?.to);
    }
    return {} as Salary;
}

function convertToVND(amount: string, isRange: boolean, exchangeRate: number): { from: number; to: number } | number {
    let regex, m;
    amount = amount.replace(/\,/gi, '');
	if (isRange)
		regex = /(\d+)-(\d+)/gm;
	else
        regex = /(\d+)/gm;

    while ((m = regex.exec(amount)) !== null) {
        if (m.index === regex.lastIndex)
            regex.lastIndex++;
        try {
            if(isRange)
                return { from: parseInt(m[1]) * exchangeRate, to: parseInt(m[2]) * exchangeRate };
            else
                return parseInt(m[1]) * exchangeRate;
        } catch(err) {
            logger.error(err);
            if(isRange)
                throw new Error(`Some thing wrong happen when converting to VND(${m[1]}/${m[2]})`);
            else
                throw new Error(`Some thing wrong happen when converting to VND(${m[1]})`);
            
        }
    }
    return -1;
}

function getSalaryConcurrency(salary: string): 'vnd' | 'usd' | 'none' {
	if (salary.includes('vnd')) return 'vnd';
	if (salary.includes('usd')) return 'usd';
	if (salary.includes('canh tranh')) return 'none';
	throw new Error(`Having problem when getting salary concurrency: ${salary}`);
}

type SalaryRange = { format: 'from' | 'to' | 'none'; isRange: boolean };
function getSalaryRange(salary: string): SalaryRange {
	const result: SalaryRange = { format: 'from', isRange: true };
	if (salary.includes('duoi')) result.format = 'to';
	else if (salary.includes('tren')) result.format = 'from';
	else result.format = 'none';

	/* Get Range */
	if (salary.includes('-')) result.isRange = true;
	else result.isRange = false;

	return result;
}