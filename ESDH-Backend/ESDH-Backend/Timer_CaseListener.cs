//using Helpers;
//using System.Security.Cryptography.X509Certificates;
//using Microsoft.Azure.Functions.Worker;
//using Microsoft.Extensions.Logging;
//using Microsoft.SharePoint.Client;
//using PnP.Framework;
//using Microsoft.Extensions.Configuration;
//using Azure.Storage.Queues;
//using Newtonsoft.Json;
//using System.Text;

//namespace ESDH_Backend {
//    public class Timer_CaseListener {
//        private readonly ILogger _logger;
//        private readonly IConfiguration _config;

//        public Timer_CaseListener(ILoggerFactory loggerFactory, IConfiguration config) {
//            _logger = loggerFactory.CreateLogger<Timer_CaseListener>();
//            _config = config;
//        }

//        [Function("Timer_CaseListener")]
//        public void Run([TimerTrigger("0 */5 * * * *", RunOnStartup = true)] TimerInfo myTimer) {
//            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");

//            FunctionConfiguration config = new(_config);
//            string storageQueueName = "esdhcase-queue";

//            //----------------------------------------------

//            _logger.LogInformation("Loading certificate from Key Vault...");
//            X509Certificate2 cert = AzureHelper.GetKeyVaultCertificate(config.KeyVaultUri, config.KeyVaultCertificateName);
//            AuthenticationManager auth = new(config.ClientId, cert, config.TenantId);

//            _logger.LogInformation("Certificate loaded from Key Vault");
//            ClientContext ctx = SharePoint.LoadSPContext(auth, config.EsdhSiteUrl);

//            List caseList = ctx.Web.Lists.GetById(config.CaseListGuid);
//            ctx.Load(caseList);
//            ctx.ExecuteQuery();

//            CamlQuery camlQuery = new() {
//                ViewXml = "<View><Query><Where><Or><IsNull><FieldRef Name='esdhSiteStatus' /></IsNull><Eq><FieldRef Name='esdhSiteStatus' /><Value Type='Text'>New</Value></Eq></Or></Where></Query></View>"
//            };
//            ListItemCollection caseItems = caseList.GetItems(camlQuery);
//            ctx.Load(caseItems);
//            ctx.ExecuteQuery();

//            QueueClient queueClient = new(config.AzureWebJobsStorage, storageQueueName);
//            queueClient.CreateIfNotExists();

//            if (!queueClient.Exists()) {
//                throw new Exception("Queue does not exist");
//            }

//            for (int i = 0; i < caseItems.Count; i++) {
//                ListItem item = caseItems[i];

//                string jsonString = JsonConvert.SerializeObject(item.Id.ToString());
//                byte[] messageBytes = Encoding.UTF8.GetBytes(jsonString);
//                queueClient.SendMessage(Convert.ToBase64String(messageBytes));

//                item["esdhSiteStatus"] = "Queued";
//                item.Update();
//                ctx.ExecuteQuery();
//            }

//        }
//    }
//}