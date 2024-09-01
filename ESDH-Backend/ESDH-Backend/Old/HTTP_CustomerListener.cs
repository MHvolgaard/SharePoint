//using Azure.Storage.Queues;
//using Helpers;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.Azure.Functions.Worker;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.Logging;
//using Newtonsoft.Json;
//using System.Text;
//using System.Xml;

//namespace ESDH_Backend {
//    public class HTTP_CustomerListener {
//        private readonly ILogger<HTTP_CustomerListener> _logger;
//        private readonly IConfiguration _config;

//        public HTTP_CustomerListener(ILogger<HTTP_CustomerListener> logger, IConfiguration config) {
//            _logger = logger;
//            _config = config;
//        }

//        [Function(nameof(HTTP_CustomerListener))]
//        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req) {
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

//            QueueItem queueItem = new() {
//                SiteUrl = xmlDoc.GetElementsByTagName("WebUrl")[0].InnerText,
//                ListID = xmlDoc.GetElementsByTagName("ListId")[0].InnerText,
//                ItemID = Convert.ToInt32(xmlDoc.GetElementsByTagName("ListItemId")[0].InnerText),
//                EventType = xmlDoc.GetElementsByTagName("EventType")[0].InnerText
//            };

//            QueueClient queueClient = new(_config["AzureWebJobsStorage"], "esdhcustomer-queue");
//            queueClient.CreateIfNotExists();

//            if (queueClient.Exists()) {
//                string jsonString = JsonConvert.SerializeObject(queueItem);
//                byte[] messageBytes = Encoding.UTF8.GetBytes(jsonString);
//                queueClient.SendMessage(Convert.ToBase64String(messageBytes));
//            } else {
//                _logger.LogError("Queue does not exist");
//            }

//            return new OkObjectResult("Done");
//        }
//    }
//}
