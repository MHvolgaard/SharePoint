using Helpers;
using Helpers.Penneo.Classes;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SharePoint.Client;
using Newtonsoft.Json;
using Penneo;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using AuthenticationManager = PnP.Framework.AuthenticationManager;
using File = Microsoft.SharePoint.Client.File;

namespace ESDH_Backend {
    public class HTTP_SendToPenneo {
        private readonly ILogger<HTTP_SendToPenneo> _logger;
        private readonly IConfiguration _config;

        public HTTP_SendToPenneo(ILogger<HTTP_SendToPenneo> logger, IConfiguration config) {
            _logger = logger;
            _config = config;
        }

        [Function("HTTP_SendToPenneo")]
        public async Task<HttpResponse> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequest req) {
            var response = req.HttpContext.Response;
            response.ContentType = "application/json";

            if (req.Method == "GET") {
                _logger.LogInformation("Wake call received. Returning OK...");
                response.StatusCode = (int)HttpStatusCode.OK;
                await response.WriteAsync("OK");
                return response;
            }

            string httpPostData = string.Empty;

            StreamReader reader = new(req.Body, Encoding.UTF8);
            if (reader != null) {
                httpPostData = await reader.ReadToEndAsync();
            }
            SpPayload reqBody = JsonConvert.DeserializeObject<SpPayload>(httpPostData) ?? new();

            if (
                string.IsNullOrWhiteSpace(reqBody.Token) ||
                string.IsNullOrWhiteSpace(reqBody.Hmac) ||
                string.IsNullOrWhiteSpace(reqBody.SiteUrl) ||
                string.IsNullOrWhiteSpace(reqBody.ListId) ||
                string.IsNullOrWhiteSpace(reqBody.CasefileName) ||
                string.IsNullOrWhiteSpace(reqBody.FolderUrl) ||
                reqBody.Files.Count == 0
                ) {
                throw new Exception("Please pass all required parameters correctly in the request body.");
            }

            if (!Crypt.VerifyHMAC(reqBody.Token, reqBody.Hmac, "xrauzbnufwxorinatkvorvqcczvekdze")) {
                throw new Exception("Invalid HMAC signature.");
            }

            // Decrypt the token
            string decryptedToken = Crypt.Decrypt(reqBody.Token, "zxaqncrvbzdgqmeraxyquxfthskozfdu");
            if (string.IsNullOrWhiteSpace(decryptedToken)) {
                throw new Exception("Invalid token.");
            }

            FunctionConfiguration config = new(_config);
            string attributeFolderUrl = "esdh/folderurl"; // must be lowercase in Penneo

            //----------------------------------------------

            _logger.LogInformation("Loading certificate from Key Vault...");
            X509Certificate2 cert = AzureHelper.GetKeyVaultCertificate(config.KeyVaultUri, config.KeyVaultCertificateName);
            AuthenticationManager auth = new(config.ClientId, cert, config.TenantId);

            ClientContext ctx = SharePoint.LoadSPContext(auth, reqBody.SiteUrl);
            ctx.Load(ctx.Web, w => w.Url);
            ctx.ExecuteQuery();
            _logger.LogInformation($"Connected to SharePoint Online - {ctx.Web.Url}");

            _logger.LogInformation("Loading files from SharePoint...");
            Dictionary<string, string> base64Documents = [];
            for (int i = 0; i < reqBody.Files.Count; i++) {
                SpPayloadFile file = reqBody.Files[i];

                if (Path.GetExtension(file.ServerRelativeUrl) != ".pdf") {
                    _logger.LogInformation($"File {file.ServerRelativeUrl} is not a PDF file. Skipping...");
                    continue;
                }

                string fileName = Path.GetFileNameWithoutExtension(file.ServerRelativeUrl);
                File spFile = ctx.Web.GetFileByServerRelativeUrl(file.ServerRelativeUrl);

                var binaryDate = spFile.OpenBinaryStream();
                ctx.ExecuteQuery();

                var ms = new MemoryStream();
                binaryDate.Value.CopyTo(ms);
                byte[] bytes = ms.ToArray();
                base64Documents.Add(fileName, Convert.ToBase64String(bytes));

                ms.Close();
            }


            _logger.LogInformation("Connecting to Penneo...");
            PenneoClient penneo = new(config.PenneoClientId, config.PenneoClientSecret, config.PenneoApiKey, config.PenneoApiSecret);
            penneo.UseToken(decryptedToken);

            CaseFile caseFile = await penneo.CreateCaseFile(reqBody.CasefileName, 1);
            _logger.LogInformation($"Case file created: {caseFile.id}");

            await penneo.LinkCaseFileToFolder(caseFile.id, config.PenneoFolderId);
            _logger.LogInformation($"Case file: {caseFile.id} moved to folder: {config.PenneoFolderId}");

            //await penneo.CreateCaseFileAttribute(caseFile.id, attributeSiteUrl, reqBody.SiteUrl);
            //_logger.LogInformation($"Case file attribute added: {attributeSiteUrl} - {reqBody.SiteUrl}");

            await penneo.CreateCaseFileAttribute(caseFile.id, attributeFolderUrl, reqBody.FolderUrl);
            _logger.LogInformation($"Case file attribute added: {attributeFolderUrl} - {reqBody.FolderUrl}");

            _logger.LogInformation("Uploading documents to case file...");
            foreach (KeyValuePair<string, string> doc in base64Documents) {
                PenneoDocument newDoc = await penneo.CreateDocument(caseFile.id, doc.Key, doc.Value);
                _logger.LogInformation($"Document uploaded: {newDoc.id}");
            }

            _logger.LogInformation("Updating SharePoint file Penneo status...");
            List list = ctx.Web.Lists.GetById(new Guid(reqBody.ListId));
            for (int i = 0; i < reqBody.Files.Count; i++) {
                SpPayloadFile file = reqBody.Files[i];

                string extension = Path.GetExtension(Path.GetFileName(file.ServerRelativeUrl));

                if (extension != ".pdf") {
                    _logger.LogInformation($"File {file.ServerRelativeUrl} is not a PDF({extension}) file. Skipping...");
                    continue;
                }

                ListItem item = list.GetItemById(file.Id);
                item["esdhPenneoStatus"] = "Sendt til Penneo";
                item.Update();
                ctx.ExecuteQuery();
            }

            _logger.LogInformation("Done");
            response.StatusCode = (int)HttpStatusCode.OK;
            await response.WriteAsync(caseFile.id.ToString());
            return response;
        }
    }
}
