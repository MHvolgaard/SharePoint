using Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SharePoint.Client;
using Newtonsoft.Json;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.RegularExpressions;
using File = Microsoft.SharePoint.Client.File;
using ListItem = Microsoft.SharePoint.Client.ListItem;
using AuthenticationManager = PnP.Framework.AuthenticationManager;

namespace ESDH_Backend {
    public class HTTP_GenerateTemplate {
        private readonly ILogger<HTTP_GenerateTemplate> _logger;
        private readonly IConfiguration _config;

        public HTTP_GenerateTemplate(ILogger<HTTP_GenerateTemplate> logger, IConfiguration config) {
            _logger = logger;
            _config = config;
        }

        [Function(nameof(HTTP_GenerateTemplate))]
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
            TemplatePayload reqBody = JsonConvert.DeserializeObject<TemplatePayload>(httpPostData) ?? new();

            if (
                string.IsNullOrEmpty(reqBody.UserPrincipalName) ||
                string.IsNullOrEmpty(reqBody.Type) ||
                string.IsNullOrEmpty(reqBody.ListID) ||
                reqBody.ItemID < 1 ||
                string.IsNullOrEmpty(reqBody.DestinationFolderUrl)
                ) {
                throw new Exception("Please pass all required parameters correctly in the request body.");
            }

            if (reqBody.SourceFiles.Count == 0) {
                response.StatusCode = (int)HttpStatusCode.OK;
                await response.WriteAsJsonAsync(new { });

                return response;
            }

            Uri sourceUri = new(reqBody.SourceFiles[0].FileUrl);
            if (sourceUri.Segments.Length < 3) throw new Exception("Please pass a valid SharePoint Online URL (Source) in the request body.");
            string sourceSiteUrl = $"{sourceUri.Scheme}://{sourceUri.Host}/{sourceUri.Segments[1]}{sourceUri.Segments[2]}";

            Uri destinationUri = new(reqBody.DestinationFolderUrl);
            if (destinationUri.Segments.Length < 3) throw new Exception("Please pass a valid SharePoint Online URL (Destination) in the request body.");
            string destinationSiteUrl = $"{destinationUri.Scheme}://{destinationUri.Host}/{destinationUri.Segments[1]}{destinationUri.Segments[2]}";
            string spRootUrl = $"{destinationUri.Scheme}://{destinationUri.Host}";

            FunctionConfiguration config = new(_config);

            //----------------------------------------------

            _logger.LogInformation("Loading certificate from Key Vault...");
            X509Certificate2 cert = AzureHelper.GetKeyVaultCertificate(config.KeyVaultUri, config.KeyVaultCertificateName);
            AuthenticationManager auth = new(config.ClientId, cert, config.TenantId);

            ClientContext esdhCtx = SharePoint.LoadSPContext(auth, config.EsdhSiteUrl);
            esdhCtx.Load(esdhCtx.Web, w => w.Url);
            esdhCtx.ExecuteQuery();
            _logger.LogInformation($"Connected to SharePoint Online - {esdhCtx.Web.Url}");

            List fieldMappingList = esdhCtx.Web.Lists.GetById(config.FieldMappingListGuid);
            ListItemCollection fieldMappingItems = fieldMappingList.GetItems(CamlQuery.CreateAllItemsQuery());
            esdhCtx.Load(fieldMappingItems);
            esdhCtx.ExecuteQuery();
            _logger.LogInformation("Field mapping items loaded");

            var fieldMappingGroups = fieldMappingItems.GroupBy(f => f.GetFieldValueAs<string>("esdhSource"));

            List<ListItem> customerFields = [.. fieldMappingItems.Where(fieldMappingItems => fieldMappingItems.GetFieldValueAs<string>("esdhSource") == "Customers")];
            List<ListItem> employeeFields = [.. fieldMappingItems.Where(fieldMappingItems => fieldMappingItems.GetFieldValueAs<string>("esdhSource") == "Employees")];

            List customerList = esdhCtx.Web.Lists.GetById(config.CustomerListGuid);
            List employeeList = esdhCtx.Web.Lists.GetById(config.EmployeeListGuid);
            Dictionary<string, string> customerFieldTypes = SharePoint.GetFieldTypeMapping(customerList);
            Dictionary<string, string> employeeFieldTypes = SharePoint.GetFieldTypeMapping(employeeList);
            _logger.LogInformation("Field types loaded");

            int customerItemId = reqBody.ItemID;
            if (reqBody.Type == "Case") {
                List caseList = esdhCtx.Web.Lists.GetById(config.CaseListGuid);
                ListItem caseItem = caseList.GetItemById(reqBody.ItemID);
                esdhCtx.Load(caseItem);
                esdhCtx.ExecuteQuery();
                customerItemId = caseItem.GetFieldValueAs<int>("esdhCustomerId");
            }

            Dictionary<string, string> documentFieldValues = [];

            ListItem customerItem = customerList.GetItemById(reqBody.ItemID);
            esdhCtx.Load(customerItem);
            esdhCtx.ExecuteQuery();
            _logger.LogInformation("Customer item loaded");

            //reqBody.UserPrincipalName = "mst@fjordland.dk"; // For testing
            CamlQuery camlQuery = new() {
                ViewXml = $"<View><Query><Where><Eq><FieldRef Name='esdhEmployee' /><Value Type='Text'>{reqBody.UserPrincipalName}</Value></Eq></Where></Query></View>"
            };

            ListItemCollection employeeItems = employeeList.GetItems(camlQuery);
            esdhCtx.Load(employeeItems);
            esdhCtx.ExecuteQuery();
            _logger.LogInformation("Employee items loaded");

            if (employeeItems.Count > 0) {
                ListItem employeeItem = employeeItems[0];

                AddToFieldValues(documentFieldValues, employeeItem, employeeFields, employeeFieldTypes);
                _logger.LogInformation("Employee values mapped to document fields");
            }

            AddToFieldValues(documentFieldValues, customerItem, customerFields, customerFieldTypes);
            _logger.LogInformation("Customer values mapped to document fields");

            ClientContext destCtx = SharePoint.LoadSPContext(auth, destinationSiteUrl);
            destCtx.Load(destCtx.Web, w => w.Url);
            destCtx.ExecuteQuery();
            _logger.LogInformation($"Connected to SharePoint Online as {destCtx.Web.Url}");

            var destFolder = destCtx.Web.GetFolderByServerRelativeUrl(destinationUri.AbsolutePath);
            destCtx.Load(destFolder, f => f.Files, f => f.ServerRelativeUrl);
            destCtx.ExecuteQuery();
            _logger.LogInformation("Destination folder loaded");

            string fileServerRelativeUrl = null;
            for (int i = 0; i < reqBody.SourceFiles.Count; i++) {
                TemplatePayloadFile file = reqBody.SourceFiles[i];

                fileServerRelativeUrl = GenerateFileFromTemplate(esdhCtx, destCtx, file, documentFieldValues, destFolder, reqBody.UserPrincipalName);
            }

            esdhCtx.Dispose();
            destCtx.Dispose();

            TemplateCreationResponse responseBody = new() {
                FolderUrl = $"{spRootUrl}{destFolder.ServerRelativeUrl}",
                FileUrl = $"{spRootUrl}{fileServerRelativeUrl}"
            };

            response.StatusCode = (int)HttpStatusCode.OK;
            await response.WriteAsJsonAsync(responseBody);

            return response;
        }

        private void AddToFieldValues(Dictionary<string, string> fieldValues, ListItem item, List<ListItem> fieldsItems, Dictionary<string, string> fieldTypes) {
            foreach (ListItem field in fieldsItems) {
                try {
                    string value = "*Not implemented*";

                    string documentFieldName = field.GetFieldValueAs<string>("Title");
                    string fieldName = field.GetFieldValueAs<string>("esdhFieldName");

                    if (!string.IsNullOrEmpty(fieldName)) {
                        string fieldType = fieldTypes[fieldName];
                        value = SharePoint.ToStringFieldValue(item, fieldName, fieldType);
                    }

                    fieldValues.Add(documentFieldName, value);
                } catch (Exception e) {
                    _logger.LogWarning($"Error mapping field: {e.Message}");
                }
            }
        }

        private string GenerateFileFromTemplate(ClientContext sourceCtx, ClientContext destCtx, TemplatePayloadFile file, Dictionary<string, string> documentFieldValues, Folder destFolder, string userPrincipalName) {
            string fileExtension = Path.GetExtension(file.FileName);
            var sourceFile = sourceCtx.Web.GetFileByUrl(file.FileUrl);
            var clientResultStream = sourceFile.OpenBinaryStream();
            sourceCtx.ExecuteQuery();
            var sourceStream = clientResultStream.Value;

            var destStream = new MemoryStream();
            sourceStream.CopyTo(destStream);
            sourceStream.Close();

            Documents.ReplaceDynamicText(fileExtension, destStream, documentFieldValues, _logger);

            int counter = 0;
            bool isUnique = false;

            string fileName = "";
            //string input = reqBody.FileName.Substring(0, reqBody.FileName.LastIndexOf('.')); // Remove file extension
            string input = Path.GetFileNameWithoutExtension(file.FileName); // Remove file extension
                                                                            //string fileExtension = reqBody.FileName.Substring(reqBody.FileName.LastIndexOf('.')); // Get file extension
            string pattern = @"[""'*:<>/\|?]";
            while (!isUnique) {
                fileName = Regex.Replace(input, pattern, "");
                if (counter > 0) fileName += $" ({counter})";
                fileName += fileExtension;

                var existingFile = destFolder.Files.FirstOrDefault(s => s.Name == fileName);

                if (existingFile == null) isUnique = true;
                counter += 1;
            }

            destStream.Position = 0;
            FileCreationInformation fileCreate = new() {
                Url = fileName,
                ContentStream = destStream
            };

            File newFile = destFolder.Files.Add(fileCreate);
            destCtx.Load(newFile, n => n.ListItemAllFields, n => n.ServerRelativeUrl);
            destCtx.ExecuteQuery();
            _logger.LogInformation($"File {fileName} created in {destFolder.ServerRelativeUrl}");

            User user = destCtx.Web.EnsureUser(userPrincipalName);
            destCtx.Load(user);
            destCtx.ExecuteQuery();

            newFile.ListItemAllFields["Editor"] = user;
            newFile.ListItemAllFields["Author"] = user;
            newFile.ListItemAllFields.UpdateOverwriteVersion();
            destCtx.ExecuteQuery();
            _logger.LogInformation("File metadata updated");

            destStream.Close();

            return newFile.ServerRelativeUrl;
        }
    }
}
