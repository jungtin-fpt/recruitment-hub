import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LEVEL } from '../job/utils/level';
import { WORK_METHOD } from '../job/utils/work-method';
import { Company } from './Company';
import { Section } from './Section';

@Entity()
export class Job extends BaseEntity {
	@PrimaryGeneratedColumn({
		unsigned: true,
	})
	id: number;

	@Column()
	public url: string;

	@Column()
	public title: string;

	@Column({
        type: 'text'
    })
	public description: string;

	@Column()
	public regionName: string;

	@Column()
	public regionNormalize: string;

	@Column()
	public workAddress: string;

	@Column({
		type: 'enum',
		enum: WORK_METHOD,
		default: WORK_METHOD.FULL_TIME,
	})
	public workMethod: WORK_METHOD;

	@Column({
		type: 'enum',
		enum: LEVEL,
		default: LEVEL.STAFF,
	})
	public level: LEVEL;

	@Column({
		type: 'simple-array',
	})
	public skills: string[];

	@Column({
        nullable: true,
    })
	public requiredExp?: string;

	@Column({
        nullable: true,
    })
	public salaryFrom?: number;

	@Column({
        nullable: true,
    })
	public salaryTo?: number;

	@ManyToOne(() => Company, (company) => company.jobs)
	public company: Company;

	@ManyToOne(() => Section, (section) => section.jobs)
	public section: Section;

	constructor(
		url: string,
		title: string,
		level: LEVEL,
		description: string,
		regionName: string,
		regionNormalize: string,
		workAddress: string,
		workMethod: WORK_METHOD,
		salaryFrom: number | undefined,
		salaryTo: number | undefined,
		skills: string[],
		section: Section,
		company: Company
	) {
        super();
        this.url = url;
        this.title = title;
        this.level = level;
        this.description = description;
        this.regionName = regionName;
        this.regionNormalize = regionNormalize;
        this.workAddress = workAddress;
        this.workMethod = workMethod;
        this.regionNormalize = regionNormalize;
        this.salaryFrom = salaryFrom;
        this.salaryTo = salaryTo;
        this.skills = skills;
        this.section = section;
        this.company = company;
    }
}
