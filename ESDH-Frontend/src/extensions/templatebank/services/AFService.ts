import { IHttpClientOptions, HttpClient } from '@microsoft/sp-http';
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility';
import { TTemplatePayload } from '../models/TTemplateRequest';
import { FunctionKey, GenerateTemplateEndpoint } from '../../../config';

export default class AFService {
	private static context: ListViewCommandSetContext;

	public static init(context: ListViewCommandSetContext): void {
		this.context = context;
	}

	public static async generateFileFromTemplates(template: TTemplatePayload): Promise<{ fileUrl: string, folderUrl: string }> {
		const requestHeaders: Headers = new Headers();
		requestHeaders.append('Content-type', 'application/json');
		requestHeaders.append('x-functions-key', FunctionKey);

		const httpClientOptions: IHttpClientOptions = {
			body: JSON.stringify(template),
			headers: requestHeaders
		};

		const response = await this.context.httpClient.post(
			GenerateTemplateEndpoint,
			HttpClient.configurations.v1,
			httpClientOptions);
		if (response.status !== 200) {
			throw new Error(`Error with creating case: ${response.statusText}`);
		}

		return await response.json();
	}
}