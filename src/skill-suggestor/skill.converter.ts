import { removeExtraSpaceAndBreakline } from "../util/formatter";

export type SkillMap = Map<string, number>;
export function convertToSkillMap(descriptions: string[] | string): SkillMap {
	let skillMap = new Map<string, number>();
	if(typeof descriptions === 'object') {
		descriptions.forEach(desc => {
			skillMap = syncToSkillMap(normalize(desc), skillMap);
		})
	}
	if(typeof descriptions === 'string') {
		skillMap = syncToSkillMap(normalize(descriptions), skillMap);
	}

	return skillMap;
}

function syncToSkillMap(skills: string[], skillMap: SkillMap): SkillMap {
	const skillSet = new Set(skills);
	skillSet.forEach(k => {
		if(skillMap.has(k)) {
			const count = skillMap.get(k)!;
			skillMap.set(k, count + 1);
		} else
			skillMap.set(k, 1);
	});

	return skillMap;
}

function normalize(description: string): string[] {
	description = description.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|{|}|\||\\/g, ' ').toLowerCase();
    description = description.replace(/\s\d+\s/gm, ' ');
    description = description.replace(/(\B-\b|\B-+\B|\b-\B)+/gm, '');
	description = removeExtraSpaceAndBreakline(description);
	return description.split(' ').map(skill => skill.replace(/[\.]+/gi, '').trim());
}