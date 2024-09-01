

// Azure function
export const FunctionKey = 'fYMaUPK-yQvYD0xMJb88qA5dNOkCnxEdPwA_UL3rs9imAzFurxGSnA==';
export const RootFunctionEndpoint = 'https://netip-esdh-fjordland.azurewebsites.net';
// const RootFunctionEndpoint = 'http://localhost:7117';

export const sendToPenneoAFEndpointS = `${RootFunctionEndpoint}/api/HTTP_SendToPenneo`;
export const GenerateTemplateEndpoint = `${RootFunctionEndpoint}/api/HTTP_GenerateTemplate`;

export const CorsProxyEndpoint = `https://netip-esdh-fjordland.azurewebsites.net/api/HTTP_CorsProxy?code=${FunctionKey}&url=`;


// Penneo
export const EncryptionKey = 'zxaqncrvbzdgqmeraxyquxfthskozfdu';
export const HmacKey = 'xrauzbnufwxorinatkvorvqcczvekdze';

export const AuthEndpoint = 'https://sandbox.oauth.penneo.cloud/oauth/authorize';
export const ClientId = 'be5f0c9593f4ce4bfa9e2fe7f2ec5a417a04955357543530001f85acf72bf690';
export const RedirectUri = 'https://fjordland.sharepoint.com/';
export const ClientSecret = '26137180fa1bea22b380908d0323f5fbcf5f19d46017483ff6e808580d7013852c85301896e9e86ea618';
export const TokenEndpoint = `${CorsProxyEndpoint}${'https://sandbox.oauth.penneo.cloud/oauth/token'}`;

export const CaseFileUrl = 'https://sandbox.penneo.com/casefiles/draft/#caseFileId#/details';

