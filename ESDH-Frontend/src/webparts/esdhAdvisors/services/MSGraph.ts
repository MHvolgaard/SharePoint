import { WebPartContext } from '@microsoft/sp-webpart-base';
import { GraphFI, SPFx, graphfi } from "@pnp/graph";
import "@pnp/graph/users";

export interface IGraphBatchRequest {
    id: string;
    dependsOn?: string[];
    method: string;
    url: string;
}

export interface IGraphBatchBody {
    requests: IGraphBatchRequest[];
}

export class MSGraph {
    public static graph: GraphFI;
    public static Init(context: WebPartContext): void {
        this.graph = graphfi().using(SPFx(context));
    }

    public static async getUsers(): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        return await this.graph.users();
    }
}
