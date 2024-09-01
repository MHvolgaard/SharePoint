import { IHttpClientOptions, HttpClient } from '@microsoft/sp-http';
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility';
import { TMultiTemplateRequest, TSingleTemplateRequest } from '../models/TTemplateRequest';

const functionKey = "Hk3n78p1wDztpUG7NfpbWXvdmpUMgArhC-OXVl1EYriZAzFuh9rAMQ==";
// const defaultEndpoint = "http://localhost:7236/";
const defaultEndpoint = "https://netip-esdh-demo.azurewebsites.net/";

// const createTemplateUrl = "https://webhook.site/d5ca8794-54e7-4373-8946-5cb733d510f4";
const singleTemplateUrl = defaultEndpoint + "api/HTTP_CreateTemplateSingle";
const multiTemplateUrl = defaultEndpoint + "api/HTTP_CreateTemplateMulti";

export default class AFService {
	private static context: ListViewCommandSetContext;

	public static init(context: ListViewCommandSetContext): void {
		this.context = context;
	}

	public static async singleTemplate(template: TSingleTemplateRequest): Promise<{ fileUrl: string, folderUrl: string }> {
		const body: string = JSON.stringify(template);
		const requestHeaders: Headers = new Headers();
		requestHeaders.append('Content-type', 'application/json');
		requestHeaders.append('x-functions-key', functionKey);

		const httpClientOptions: IHttpClientOptions = {
			body: body,
			headers: requestHeaders
		};

		const response = await this.context.httpClient.post(
			singleTemplateUrl,
			HttpClient.configurations.v1,
			httpClientOptions);
		if (response.status !== 200) {
			throw new Error(`Error with creating case: ${response.statusText}`);
		}

		const result = await response.text();
		return JSON.parse(result);
	}

	public static async multiTemplate(templates: TMultiTemplateRequest): Promise<void> {
		const body: string = JSON.stringify(templates);
		const requestHeaders: Headers = new Headers();
		requestHeaders.append('Content-type', 'application/json');
		requestHeaders.append('x-functions-key', functionKey);

		const httpClientOptions: IHttpClientOptions = {
			body: body,
			headers: requestHeaders
		};

		const response = await this.context.httpClient.post(
			multiTemplateUrl,
			HttpClient.configurations.v1,
			httpClientOptions);
		if (response.status !== 200) {
			throw new Error(`Error with creating case: ${response.statusText}`);
		}
	}
}