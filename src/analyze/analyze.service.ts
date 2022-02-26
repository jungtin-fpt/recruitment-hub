import { Job } from '../entity/Job';
import { Section } from '../entity/Section';
import { Skill } from '../entity/Skill';
import { EntityNotFoundError } from '../error/entity-not-found.error';
import { Salary } from '../job/utils/salary';
import { SALARY_STATE } from '../job/utils/salary-state';

let verifiedSkills: Skill[];
export async function analyzeAndGenerateReport(sectionId: number): Promise<{
	[key: string]: { [key: string]: number }
}> {
	const section = await Section.findOne(sectionId, {
		relations: ['jobs', 'jobs.company'],
	});

	if (!section) throw new EntityNotFoundError('Section', sectionId);

	let regionMap = new Map<string, number>();
	let regionNormalizeMap = new Map<string, number>();
	let workMethodMap = new Map<string, number>();
	let skillMap = new Map<string, number>();
	let levelMap = new Map<string, number>();
	let suggestedSkillMap = new Map<string, number>();
	let companyIdMap = new Map<string, number>();
	let companyMap = new Map<string, number>();
	let salaryStateMap = new Map<string, number>();

	(
		await Promise.all(
			section?.jobs.map(async (job) => {
				return {
					...job,
					suggestedSkills: await generateSuggestedSkills(job.description),
					salaryState: analyzeSalary(job.salaryFrom, job.salaryTo),
				};
			})
		)
	).forEach((job) => {
		regionNormalizeMap = syncToMap(regionNormalizeMap, job.regionNormalize);
		workMethodMap = syncToMap(workMethodMap, job.workMethod);
		levelMap = syncToMap(levelMap, job.level);
		companyIdMap = syncToMap(companyIdMap, job.company.id.toString());
		salaryStateMap = syncToMap(salaryStateMap, job.salaryState);
		skillMap = syncToSkillMap(skillMap, job.skills);
		suggestedSkillMap = syncToSkillMap(suggestedSkillMap, job.suggestedSkills);
	});

	for (const [regionNormalize, count] of regionNormalizeMap.entries()) {
		const job = section.jobs.find((job) => job.regionNormalize === regionNormalize);
		regionMap.set(job?.regionName || 'unknown', count);
	}

	for (const [companyId, count] of companyIdMap.entries()) {
		const job = section.jobs.find((job) => job.company.id === parseInt(companyId));
		companyMap.set(job?.company.name || 'unknown', count);
	}

	return {
        regionMap: Object.fromEntries(regionMap),
        levelMap: Object.fromEntries(levelMap),
        workMethodMap: Object.fromEntries(workMethodMap),
        skillMap: Object.fromEntries(skillMap),
        suggestedSkillMap: Object.fromEntries(suggestedSkillMap),
        companyMap: Object.fromEntries(companyMap),
        salaryStateMap: Object.fromEntries(salaryStateMap),
    };
}

function syncToMap(map: Map<string, number>, value: string): Map<string, number> {
	const count = map.get(value);
	map.set(value, !!count ? count + 1 : 1);
	return map;
}

function syncToSkillMap(map: Map<string, number>, skills: string[]): Map<string, number> {
	skills.forEach((skill) => {
		const skillCount = map.get(skill);
		map.set(skill, !!skillCount ? skillCount + 1 : 1);
	});
	return map;
}

async function generateSuggestedSkills(description: string): Promise<string[]> {
	if (!verifiedSkills) {
		verifiedSkills = await Skill.find({
			select: ['name'],
			where: {
				isVerified: true,
			},
		});
	}

	return verifiedSkills
		.filter((skill) => description.includes(skill.name))
		.map((skill) => skill.name);
}

function analyzeSalary(from?: number, to?: number): SALARY_STATE {
    const MILLION = 1000000;
	const salary = new Salary(from, to);
	const midRange = salary.getMidRangeSalary();
	if (midRange === undefined) return SALARY_STATE.WAVE_AGREEMENT;
	if (midRange < 5 * MILLION) return SALARY_STATE.BELOW_FIVE;
	if (midRange >= 5 * MILLION && midRange < 10 * MILLION) return SALARY_STATE.FIVE_TO_TEN;
	if (midRange >= 10 * MILLION && midRange < 15 * MILLION) return SALARY_STATE.TEN_TO_FIFTHTEEN;
	if (midRange >= 15 * MILLION && midRange < 20 * MILLION) return SALARY_STATE.FIFTHTEEN_TO_TWENTY;
	if (midRange >= 20 * MILLION && midRange < 25 * MILLION)
		return SALARY_STATE.TWENTY_TO_TWENTY_FIVE;
	if (midRange >= 25 * MILLION && midRange < 30 * MILLION)
		return SALARY_STATE.TWENTY_FIVE_TO_THIRDTY;
	if (midRange >= 30 * MILLION) return SALARY_STATE.ABOVE_THIRDTY;
	if (midRange >= 40 * MILLION) return SALARY_STATE.ABOVE_FORTY;
	if (midRange >= 50 * MILLION) return SALARY_STATE.ABOVE_FIFTY;
	if (midRange >= 70 * MILLION) return SALARY_STATE.ABOVE_SEVENTY;

	return SALARY_STATE.WAVE_AGREEMENT;
}
