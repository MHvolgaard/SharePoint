//using Azure.Storage.Queues;
//using Helpers;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.Azure.Functions.Worker;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.Logging;
//using Microsoft.SharePoint.Client;
//using Newtonsoft.Json;
//using System.Security.Cryptography.X509Certificates;
//using System.Text;
//using System.Xml;

//namespace ESDH_Backend {
//    public class HTTP_PermissionChanges {
//        private readonly ILogger<HTTP_PermissionChanges> _logger;
//        private readonly IConfiguration _config;

//        public HTTP_PermissionChanges(ILogger<HTTP_PermissionChanges> logger, IConfiguration config) {
//            _logger = logger;
//            _config = config;
//        }

//        [Function(nameof(HTTP_PermissionChanges))]
//        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequest req) {
//            _logger.LogInformation("Function 'HTTP_PermissionChanges' triggered");

//            string httpPostData = string.Empty;

//            StreamReader reader = new(req.Body, Encoding.UTF8);
//            if (reader != null) {
//                httpPostData = await reader.ReadToEndAsync();
//            }

//            if (string.IsNullOrWhiteSpace(httpPostData)) {
//                return new BadRequestObjectResult("Error: 'httpPostBody' not found");
//            }

//            XmlDocument xmlDoc = new();
//            xmlDoc.LoadXml(httpPostData);

//            _logger.LogInformation($"Sending to queue");

//            var siteUrl = xmlDoc.GetElementsByTagName("WebUrl")[0].InnerText;
//            var listID = xmlDoc.GetElementsByTagName("ListId")[0].InnerText;
//            var itemID = Convert.ToInt32(xmlDoc.GetElementsByTagName("ListItemId")[0].InnerText);
//            var eventType = xmlDoc.GetElementsByTagName("EventType")[0].InnerText;


//            _logger.LogInformation("Loading certificate from Key Vault...");
//            X509Certificate2 cert = AzureHelper.GetKeyVaultCertificate(_config);
//            _logger.LogInformation("Certificate loaded from Key Vault");
//            ClientContext ctx = SharePoint.LoadSPAppContext(siteUrl, _config, cert);
//            ctx.Load(ctx.Web, w => w.Url);
//            ctx.ExecuteQuery();
//            _logger.LogInformation($"Loaded web: {ctx.Web.Url}");

//            _logger.LogInformation("Fetching permission item");
//            List permissionsList = ctx.Web.Lists.GetById(new Guid(listID));
//            ctx.Load(permissionsList);
//            ctx.ExecuteQuery();

//            ListItem permissionItem = permissionsList.GetItemById(itemID);
//            ctx.Load(permissionItem);
//            ctx.ExecuteQuery();

//            string customerNumber = permissionItem.GetFieldValueAs<string>("esdhCustomerNumber");

//            _logger.LogInformation("Fetching permission update task list");
//            List permissionUpdateTasksList = ctx.Web.Lists.GetById(new Guid(_config["SPO:PermissionUpdateTaskListGuid"]));
//            ctx.Load(permissionUpdateTasksList);
//            ctx.ExecuteQuery();

//            CamlQuery camlQuery = new() {
//                ViewXml = $"<View><Query><Where><Eq><FieldRef Name='esdhCustomerNumber' /><Value Type='Text'>{customerNumber}</Value></Eq></Where></Query></View>"
//            };

//            ListItemCollection permissionUpdateTasks = permissionUpdateTasksList.GetItems(camlQuery);
//            ctx.Load(permissionUpdateTasks);
//            ctx.ExecuteQuery();

//            _logger.LogInformation("Checking if permission update task exists");
//            if (permissionUpdateTasks.Count == 0) {
//                _logger.LogInformation("Creating permission update task item");
//                ListItemCreationInformation newItemInfo = new();
//                ListItem newItem = permissionUpdateTasksList.AddItem(newItemInfo);
//                newItem["esdhCustomerNumber"] = customerNumber;
//                newItem.Update();
//                ctx.ExecuteQuery();
//            } else {
//                _logger.LogInformation("Permission update task already exists");
//            }

//            return new OkObjectResult("OK");

//        }
//    }
//}
