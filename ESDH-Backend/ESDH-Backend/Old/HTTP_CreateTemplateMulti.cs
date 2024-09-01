//using Helpers;
//using Microsoft.AspNetCore.Http;
//using Microsoft.Azure.Functions.Worker;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.Logging;
//using Microsoft.SharePoint.Client;
//using Newtonsoft.Json;
//using System.Net;
//using System.Security.Cryptography.X509Certificates;
//using System.Text;
//using System.Text.RegularExpressions;
//using File = Microsoft.SharePoint.Client.File;
//using ListItem = Microsoft.SharePoint.Client.ListItem;
//using AuthenticationManager = PnP.Framework.AuthenticationManager;

//namespace ESDH_Backend.Old
//{
//    public class HTTP_CreateTemplateMulti
//    {
//        private readonly ILogger<HTTP_CreateTemplateMulti> _logger;
//        private readonly IConfiguration _config;

//        public HTTP_CreateTemplateMulti(ILogger<HTTP_CreateTemplateMulti> logger, IConfiguration config)
//        {
//            _logger = logger;
//            _config = config;
//        }

//        [Function(nameof(HTTP_CreateTemplateMulti))]
//        public async Task<HttpResponse> Run([HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req)
//        {
//            string httpPostData = string.Empty;

//            StreamReader reader = new(req.Body, Encoding.UTF8);
//            if (reader != null)
//            {
//                httpPostData = await reader.ReadToEndAsync();
//            }
//            MultiTemplateRequest reqBody = JsonConvert.DeserializeObject<MultiTemplateRequest>(httpPostData) ?? new();

//            if (reqBody.UserPrincipalName == null || reqBody.SourceFileUrls.Count == 0 || reqBody.DestinationFolderUrl == null || reqBody.ListID == null || reqBody.ItemID < 1)
//            {
//                throw new Exception("Please pass all required parameters correctly in the request body.");
//            }

//            Uri sourceUri = new(reqBody.SourceFileUrls[0]);
//            if (sourceUri.Segments.Length < 3) throw new Exception("Please pass a valid SharePoint Online URL (Source) in the request body.");
//            string sourceSiteUrl = $"{sourceUri.Scheme}://{sourceUri.Host}/{sourceUri.Segments[1]}{sourceUri.Segments[2]}";

//            Uri destinationUri = new(reqBody.DestinationFolderUrl);
//            if (destinationUri.Segments.Length < 3) throw new Exception("Please pass a valid SharePoint Online URL (Destination) in the request body.");
//            string destinationSiteUrl = $"{destinationUri.Scheme}://{destinationUri.Host}/{destinationUri.Segments[1]}{destinationUri.Segments[2]}";
//            string spRootUrl = $"{destinationUri.Scheme}://{destinationUri.Host}";





//            _logger.LogInformation("Loading certificate from Key Vault...");
//            X509Certificate2 cert = AzureHelper.GetKeyVaultCertificate(_config);
//            AuthenticationManager auth = new(_config["AAD:ClientId"], cert, _config["AAD:TenantId"]);

//            ClientContext esdhCtx = SharePoint.LoadSPContext(auth, _config["SPO:ESDHSiteUrl"]);
//            esdhCtx.Load(esdhCtx.Web, w => w.Url);
//            esdhCtx.ExecuteQuery();
//            _logger.LogInformation($"Connected to SharePoint Online - {esdhCtx.Web.Url}");

//            _logger.LogInformation("Loading customer and case items...");

//            ListItem customerItem = null;
//            ListItem caseItem = null;

//            List customerList = esdhCtx.Web.Lists.GetById(new Guid(_config["SPO:CustomerListGuid"]));
//            Dictionary<string, string> customerFieldTypes = SharePoint.GetFieldTypeMapping(customerList);
//            Dictionary<string, string> caseFieldTypes = null;

//            if (reqBody.Type == "Case")
//            {
//                List caseList = esdhCtx.Web.Lists.GetById(new Guid(_config["SPO:CaseListGuid"])); ;
//                caseFieldTypes = SharePoint.GetFieldTypeMapping(caseList);

//                caseItem = caseList.GetItemById(reqBody.ItemID);
//                esdhCtx.Load(caseItem);
//                esdhCtx.ExecuteQuery();

//                customerItem = customerList.GetItemById(caseItem.GetFieldValueAs<int>("esdhCustomerId"));
//                esdhCtx.Load(customerItem);
//                esdhCtx.ExecuteQuery();

//            }
//            else if (reqBody.Type == "Customer")
//            {
//                customerItem = customerList.GetItemById(reqBody.ItemID);
//                esdhCtx.Load(customerItem);
//                esdhCtx.ExecuteQuery();
//                Console.WriteLine();
//            }
//            else
//            {
//                throw new Exception("Invalid type");
//            }

//            esdhCtx.Dispose();



//            // Loading source site
//            ClientContext sourceCtx = SharePoint.LoadSPContext(auth, sourceSiteUrl); // ESDH Control site
//            sourceCtx.Load(sourceCtx.Web, w => w.Url);
//            sourceCtx.ExecuteQuery();
//            _logger.LogInformation($"Connected to SharePoint Online - {sourceCtx.Web.Url}");

//            _logger.LogInformation("Loading field mappings...");
//            List fieldMappingList = sourceCtx.Web.Lists.GetById(new Guid(_config["SPO:FieldMappingListGuid"]));
//            Dictionary<string, string> fieldMappings = SharePoint.GetDocumentFieldMapping(fieldMappingList);

//            // Loading destination site and folder
//            ClientContext destCtx = SharePoint.LoadSPContext(auth, destinationSiteUrl);
//            destCtx.Load(destCtx.Web, w => w.Url);
//            destCtx.ExecuteQuery();
//            _logger.LogInformation($"Connected to SharePoint Online as {destCtx.Web.Url}");

//            _logger.LogInformation("Loading destination folder...");
//            var destFolder = destCtx.Web.GetFolderByServerRelativeUrl(destinationUri.AbsolutePath);
//            destCtx.Load(destFolder, f => f.Files, f => f.ServerRelativeUrl);
//            destCtx.ExecuteQuery();




//            // Loop through each source file and create a new file in the destination folder
//            for (int i = 0; i < reqBody.SourceFileUrls.Count; i++)
//            {
//                string sourceFileUrl = reqBody.SourceFileUrls[i];

//                _logger.LogInformation("Loading source file...");
//                string sourceFileName = Path.GetFileName(sourceFileUrl);
//                string fileExtension = Path.GetExtension(sourceFileUrl);

//                var sourceFile = sourceCtx.Web.GetFileByUrl(sourceFileUrl);
//                var clientResultStream = sourceFile.OpenBinaryStream();
//                sourceCtx.ExecuteQuery();
//                var sourceStream = clientResultStream.Value;

//                var destStream = new MemoryStream();
//                sourceStream.CopyTo(destStream);
//                sourceStream.Close();


//                Documents.ReplaceDynamicText(fileExtension, destStream, customerItem, fieldMappings, customerFieldTypes, _logger);

//                if (reqBody.Type == "Case")
//                {
//                    destStream.Position = 0;
//                    Documents.ReplaceDynamicText(fileExtension, destStream, caseItem, fieldMappings, caseFieldTypes, _logger);
//                }


//                _logger.LogInformation("Creating file in destination folder...");
//                int counter = 0;
//                bool isUnique = false;

//                string fileName = "";
//                string input = sourceFileName.Substring(0, sourceFileName.LastIndexOf('.')); // Remove file extension
//                string pattern = @"[""'*:<>/\|?]";

//                while (!isUnique)
//                {
//                    fileName = Regex.Replace(input, pattern, "");
//                    if (counter > 0) fileName += $" ({counter})";
//                    fileName += fileExtension;

//                    var existingFile = destFolder.Files.FirstOrDefault(s => s.Name == fileName);

//                    if (existingFile == null) isUnique = true;
//                    counter += 1;
//                }

//                destStream.Position = 0;
//                FileCreationInformation fileCreate = new()
//                {
//                    Url = fileName,
//                    ContentStream = destStream
//                };

//                File newFile = destFolder.Files.Add(fileCreate);
//                destCtx.Load(newFile, n => n.ListItemAllFields, n => n.ServerRelativeUrl);
//                destCtx.ExecuteQuery();

//                _logger.LogInformation("Updating file metadata...");
//                User user = destCtx.Web.EnsureUser(reqBody.UserPrincipalName);
//                destCtx.Load(user);
//                destCtx.ExecuteQuery();

//                newFile.ListItemAllFields["Editor"] = user;
//                newFile.ListItemAllFields["Author"] = user;
//                newFile.ListItemAllFields.UpdateOverwriteVersion();
//                destCtx.ExecuteQuery();

//                destStream.Close();
//                _logger.LogInformation($"File {fileName} created in {destFolder.ServerRelativeUrl}");
//            }




//            sourceCtx.Dispose();
//            destCtx.Dispose();


//            var response = req.HttpContext.Response;
//            response.StatusCode = (int)HttpStatusCode.OK;
//            response.ContentType = "application/json";
//            await response.WriteAsync("OK");

//            return response;
//        }
//    }
//}
