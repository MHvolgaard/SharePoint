import "@pnp/sp/presets/all"
import { ListViewCommandSetContext } from "@microsoft/sp-listview-extensibility";
import "@pnp/sp/batching";
import { IHttpClientOptions, HttpClient } from '@microsoft/sp-http';
import { IPenneoFunctionPayload } from "../models/IPenneoFunctionPayload";
import { FunctionKey, sendToPenneoAFEndpointS } from "../../../config";

export class AF {
    public static context: ListViewCommandSetContext = null;

    public static init(nContext: ListViewCommandSetContext): void {
        this.context = nContext;
    }

    public static wakeUp(): void {
        const requestHeaders: Headers = new Headers();
        requestHeaders.append('x-functions-key', FunctionKey);

        const httpClientOptions: IHttpClientOptions = {
            headers: requestHeaders
        };

        try {
            this.context.httpClient.get( // eslint-disable-line @typescript-eslint/no-floating-promises
                sendToPenneoAFEndpointS,
                HttpClient.configurations.v1,
                httpClientOptions
            );
        } catch (error) {
            console.error(error);
        }
        // this.context.httpClient.get( // eslint-disable-line @typescript-eslint/no-floating-promises
        //     sendToPenneoAFEndpointS,
        //     HttpClient.configurations.v1,
        //     httpClientOptions
        // );
    }

    public static async sendToPenneoAF(payload: IPenneoFunctionPayload): Promise<string> {
        const requestHeaders: Headers = new Headers();
        requestHeaders.append('Content-type', 'application/json');
        requestHeaders.append('x-functions-key', FunctionKey);

        const httpClientOptions: IHttpClientOptions = {
            body: JSON.stringify(payload),
            headers: requestHeaders
        };

        const response = await this.context.httpClient.post(
            sendToPenneoAFEndpointS,
            HttpClient.configurations.v1,
            httpClientOptions
        );

        if (response.status !== 200) {
            throw new Error(`Error sending files to Penneo: ${response.statusText}`);
        }

        return await response.text();
    }
}