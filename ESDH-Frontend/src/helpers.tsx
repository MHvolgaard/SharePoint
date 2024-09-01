import { Icon } from "@fluentui/react";
import React from "react";
import { getFileTypeIconProps, FileIconType } from '@fluentui/react-file-type-icons';

export function formatDate(date: Date): string {
	if (!date) return "";
	if (!(date instanceof Date)) return "";
	return ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear();
}

export function formatDateTime(date: Date): string {
	if (!date) return "";
	if (!(date instanceof Date)) return "";
	return ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear() + ' ' + ('0' + (date.getHours())).slice(-2) + ':' + ('0' + (date.getMinutes())).slice(-2);
}

export function thousandSeperator(number: number): string {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function mergeArrays(arr1: any[], arr2: any[], identifier: string): any[] { // eslint-disable-line @typescript-eslint/no-explicit-any
	let res = [];
	res = arr1.map(obj => {
		const index = (arr2 as any).findIndex(el => el[identifier] === obj[identifier]); // eslint-disable-line @typescript-eslint/no-explicit-any
		const obj2 = index !== -1 ? arr2[index] : {};
		return {
			...obj,
			obj2
		};
	});
	return res;
}


export function filterAllProps(object: any, searchText: string): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
	for (const prop in object) {
		if (Object.prototype.hasOwnProperty.call(object, prop)) {
			const element = object[prop];
			if (typeof element === "string") {
				if (element.toLowerCase().indexOf(searchText) > -1) {
					return true;
				}
			}
			else if (typeof element === "number") {
				if (element.toString().toLowerCase().indexOf(searchText) > -1) {
					return true;
				}
			}
		}
	}
	return false;
}

export function calcDaysSince(date: Date): number {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	return Math.floor(diff / (1000 * 60 * 60 * 24));
}


export function randomText(length?: number): string {
	let text = '';
	const possible = 'ABCDE FGHIJ KLMNO PQRST UVWXYZ abcde fghijk lmn opqrs tuvwx yz 0123456789';
	length = length ? length : randomNumber();
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text.toLowerCase();
}

export function randomNumber(length?: number, max?: number): number {
	if (!length) return Math.floor(Math.random() * 100);
	let result = '';
	for (let i = 0; i < length; i++) {
		result += Math.ceil(Math.random() * (max ?? 10)) + '';
	}

	return parseInt(result);
}

// random date between 1.1.2000 and 1.1.2020
export function randomDate(): Date {
	const start = new Date(2010, 0, 1);
	const end = new Date(2024, 0, 1);
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function getFileName(path: string): string {
	return path.replace(/^.*[\\/]/, '')
}

export function getFileExtension(filename: string): string {
	if (!filename) return "";
	const result = (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename) : undefined;

	if (result) return result[0];
	return "";
}

export function fileIcon(name: string, isFolder: boolean): JSX.Element {
	if (isFolder) return <Icon {...getFileTypeIconProps({ type: FileIconType.folder, size: 20, imageFileType: 'svg' })} />
	return <Icon {...getFileTypeIconProps({ extension: getFileExtension(name), size: 20, imageFileType: 'svg' })} />
}

export function filterArray<T>(array: T[], searchText: string, propName: string = null): T[] {
	if (!array) return array;
	if (!searchText) return array;

	let search = searchText.toLowerCase().trim();
	let isExact = false;
	const quote = extractQuotes(search);

	if (!!quote) {
		search = quote;
		isExact = true;
	}

	if (propName) {
		return array.filter((item) => {
			const value = item[propName].toString().toLowerCase();
			return recursiveSearch(value, search, isExact);
		});
	} else {
		return array.filter((item) => {
			return recursiveSearch(item, search, isExact);
		});
	}
}

export function extractQuotes(str: string): string {
	const re = /"(.*?)"/g;
	const result: string[] = [];
	let current: RegExpExecArray = re.exec(str);
	while (current) {
		result.push(current.pop());
		current = re.exec(str)
	}
	return result.length > 0 ? result[0] : null;
}

export function recursiveSearch(object: any, searchText: string, isExact: boolean): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
	if (Array.isArray(object)) {
		for (const element of object) {
			if (recursiveSearch(element, searchText, isExact)) {
				return true;
			}
		}
	}
	else if (typeof object === "object") {
		for (const prop in object) {
			if (Object.prototype.hasOwnProperty.call(object, prop)) {
				const element = object[prop];
				if (recursiveSearch(element, searchText, isExact)) {
					return true;
				}
			}
		}
	}
	else if (typeof object === "string" || typeof object === "number") {
		const searchValue = object.toString().toLowerCase();
		if (isExact) {
			if (searchValue === searchText) return true;
		} else {
			if (searchValue.indexOf(searchText) > -1) return true;
		}
	}
	return false;
}
