using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.IO.Compression;
using System.Net.Http.Headers;

namespace ESDH_Backend {
    public class HTTP_CorsProxy {
        private readonly ILogger<HTTP_CorsProxy> _logger;

        public HTTP_CorsProxy(ILogger<HTTP_CorsProxy> logger) {
            _logger = logger;
        }

        [Function("HTTP_CorsProxy")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequest req) {
            string targetUrl = req.Query["url"];

            if (string.IsNullOrEmpty(targetUrl) || targetUrl.Equals("wake", StringComparison.CurrentCultureIgnoreCase)) {
                return new OkObjectResult("Wake call");
            }
            HttpClient httpClient = new();

            var requestMessage = new HttpRequestMessage {
                Method = new HttpMethod(req.Method),
                RequestUri = new Uri(targetUrl)
            };

            foreach (var header in req.Headers) {
                if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase)) {
                    requestMessage.Headers.TryAddWithoutValidation(header.Key, (IEnumerable<string>)header.Value);
                }
            }

            if (req.Method == HttpMethod.Post.Method || req.Method == HttpMethod.Put.Method) {
                using var streamReader = new StreamReader(req.Body);
                var bodyContent = await streamReader.ReadToEndAsync();
                requestMessage.Content = new StringContent(bodyContent);
                requestMessage.Content.Headers.ContentType = new MediaTypeHeaderValue(req.ContentType);
            }

            HttpResponseMessage responseMessage = await httpClient.SendAsync(requestMessage);

            string responseContent;
            if (responseMessage.Content.Headers.ContentEncoding.Contains("gzip")) {
                using var stream = await responseMessage.Content.ReadAsStreamAsync();
                using var decompressionStream = new GZipStream(stream, CompressionMode.Decompress);
                using var reader = new StreamReader(decompressionStream);
                responseContent = await reader.ReadToEndAsync();
            } else if (responseMessage.Content.Headers.ContentEncoding.Contains("deflate")) {
                using var stream = await responseMessage.Content.ReadAsStreamAsync();
                using var decompressionStream = new DeflateStream(stream, CompressionMode.Decompress);
                using var reader = new StreamReader(decompressionStream);
                responseContent = await reader.ReadToEndAsync();
            } else {
                responseContent = await responseMessage.Content.ReadAsStringAsync();
            }

            // Prepare the response
            var result = new ContentResult {
                StatusCode = (int)responseMessage.StatusCode,
                Content = responseContent,
                ContentType = responseMessage.Content.Headers.ContentType?.MediaType
            };

            req.HttpContext.Response.Headers.Append("Access-Control-Allow-Origin", "*");
            req.HttpContext.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
            req.HttpContext.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Authorization");


            return result;
        }
    }
}
