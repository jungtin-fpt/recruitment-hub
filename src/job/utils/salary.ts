export class Salary {
	constructor(public salaryFrom?: number, public salaryTo?: number) {}
    get isSalaryNotSet() {
        return !this.salaryFrom && !this.salaryTo;
    }

    getMidRangeSalary(): number | undefined {
        if(!this.salaryFrom && !this.salaryTo)
            return undefined;
        if(!this.salaryFrom && this.salaryTo)
            return this.salaryTo;
        if(this.salaryFrom && !this.salaryTo)
            return this.salaryFrom;
        if(this.salaryFrom && this.salaryTo)
            return this.salaryFrom + parseInt(((this.salaryTo - this.salaryFrom) / 2).toFixed(0));
    }
}
