export class Salary {
	constructor(public salaryFrom?: number, public salaryTo?: number) {}
    get isSalaryNotSet() {
        return !this.salaryFrom && !this.salaryTo;
    }
}
