using Helpers;
using Helpers.Penneo.Classes;
using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text;

// https://sandbox.penneo.com/api/docs

namespace Penneo {
    public class PenneoClient(string clientId, string clientSecret, string apiKey, string apiSecret) {
        //private const string API_KEY = "53f4b57003b1243ba3b7a078de950b66b0f533fb1b40614ae42ca5feac1bd246";
        //private const string API_SECRET = "3c9c9bf2ac0459617843b6e729307aadbdf559acd40c817d37cfd011ca9679cf";

        //private const string CLIENT_ID = "be5f0c9593f4ce4bfa9e2fe7f2ec5a417a04955357543530001f85acf72bf690";
        //private const string CLIENT_SECRET = "26137180fa1bea22b380908d0323f5fbcf5f19d46017483ff6e808580d7013852c85301896e9e86ea618";


        //private const string PENNEO_OAUTH_BASE_URL = "https://sandbox.oauth.penneo.cloud";
        private readonly string PENNEO_OAUTH_BASE_URL = "https://sandbox.oauth.penneo.cloud/oauth/token";


        private readonly string baseUrl = "https://sandbox.penneo.com/api/v3";

        //private PenneoToken? _token;
        private HttpClient? _httpClient;

        public async Task AuthenticateApi() {
            string created = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            string nonce = GenerateNonce(64);
            string digest = GenerateDigest(nonce, created, apiSecret);

            object payload = new {
                client_id = clientId,
                client_secret = clientSecret,
                grant_type = "api_keys",
                key = apiKey,
                nonce = Convert.ToBase64String(Encoding.UTF8.GetBytes(nonce)),
                created_at = created,
                digest
            };

            using HttpClient httpClient = new();
            var payloadJson = JsonConvert.SerializeObject(payload);
            var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");

            HttpResponseMessage response =
                await httpClient.PostAsync(PENNEO_OAUTH_BASE_URL, content);

            PenneoToken token;
            if (response.IsSuccessStatusCode) {
                string responseContent = await response.Content.ReadAsStringAsync();
                token = JsonConvert.DeserializeObject<PenneoToken>(responseContent) ?? new PenneoToken();
            } else {
                throw new Exception($"Failed to authenticate with Penneo: {response.StatusCode}");
            }

            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("authorization", $"Bearer {token.access_token}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public void UseToken(string token) {
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("authorization", $"Bearer {token}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }



        //public PenneoClient(string clientId, string clientSecret, string apiKey, string apiSecret) {
        //    string created = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        //    string nonce = GenerateNonce(64);
        //    string digest = GenerateDigest(nonce, created, apiSecret);

        //    Authenticate(new {
        //        client_id = clientId,
        //        client_secret = clientSecret,
        //        grant_type = "api_keys",
        //        key = apiKey,
        //        nonce = Convert.ToBase64String(Encoding.UTF8.GetBytes(nonce)),
        //        created_at = created,
        //        digest
        //    }).GetAwaiter().GetResult();

        //    _httpClient = new HttpClient();
        //    _httpClient.DefaultRequestHeaders.Add("authorization", $"Bearer {_token.access_token}");
        //    _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

        //}

        //private async Task Authenticate(object payload) {
        //    using HttpClient httpClient = new();
        //    var payloadJson = JsonConvert.SerializeObject(payload);
        //    var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");

        //    HttpResponseMessage response =
        //        await httpClient.PostAsync(PENNEO_OAUTH_BASE_URL, content);

        //    if (response.IsSuccessStatusCode) {
        //        string responseContent = await response.Content.ReadAsStringAsync();
        //        _token = JsonConvert.DeserializeObject<PenneoToken>(responseContent) ?? new PenneoToken();
        //    } else {
        //        throw new Exception($"Failed to authenticate with Penneo: {response.StatusCode}");
        //    }
        //}

        private static string GenerateNonce(int length) {
            var random = new Random();
            const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var nonceChars = new char[length];

            for (var i = 0; i < nonceChars.Length; i++) {
                nonceChars[i] = chars[random.Next(chars.Length)];
            }

            return new string(nonceChars);
        }

        private static string GenerateDigest(string nonce, string created, string secret) {
            using var sha1 = SHA1.Create();
            var inputBytes = Encoding.UTF8.GetBytes(nonce + created + secret);
            var hashBytes = sha1.ComputeHash(inputBytes);
            return Convert.ToBase64String(hashBytes);
        }

        public async Task<List<CaseFile>> GetCompletedCaseFilesByFolder(int folderId) {
            string url = baseUrl + $"/folders/{folderId}/casefiles";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            string responseContent = await response.Content.ReadAsStringAsync();
            List<CaseFile> caseFiles = JsonConvert.DeserializeObject<List<CaseFile>>(responseContent);

            return caseFiles.Where(cf => cf.status == 5).ToList();
        }

        public async Task LinkCaseFileToFolder(int caseFileId, int folderId) {
            string url = baseUrl + $"/folders/{folderId}/casefiles/{caseFileId}";
            HttpResponseMessage response = await _httpClient.PostAsync(url, null);
            response.EnsureSuccessStatusCode();
        }

        public async Task UnLinkCaseFileFromFolder(int caseFileId, int folderId) {
            string url = baseUrl + $"/folders/{folderId}/casefiles/{caseFileId}";
            HttpResponseMessage response = await _httpClient.DeleteAsync(url);
            response.EnsureSuccessStatusCode();
        }

        public async Task<PenneoDocumentContent> GetDocumentContent(int documentId) {
            string url = baseUrl + $"/documents/{documentId}/content?signed=true&decrypt=true";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            string responseContent = await response.Content.ReadAsStringAsync();
            PenneoDocumentContent documentContent = JsonConvert.DeserializeObject<PenneoDocumentContent>(responseContent);

            return documentContent ?? throw new Exception("Failed to get document content");
        }

        public async Task<CaseFile> CreateCaseFile(string title, int caseFileTypeId) {
            string url = baseUrl + "/casefiles";
            object body = new {
                title,
                caseFileTypeId,
                sendAt = 0,
                expireAt = 0,
            };

            HttpContent content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");
            HttpResponseMessage response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            string responseContent = await response.Content.ReadAsStringAsync();
            CaseFile caseFile = JsonConvert.DeserializeObject<CaseFile>(responseContent) ?? new CaseFile();

            return caseFile;
        }

        public async Task<PenneoDocument> CreateDocument(int caseFileId, string title, string content) {
            string url = baseUrl + $"/documents";
            object body = new {
                caseFileId,
                title,
                pdfFile = content,
            };

            HttpContent httpContent = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");
            HttpResponseMessage response = await _httpClient.PostAsync(url, httpContent);
            response.EnsureSuccessStatusCode();

            string responseContent = await response.Content.ReadAsStringAsync();
            PenneoDocument document = JsonConvert.DeserializeObject<PenneoDocument>(responseContent) ?? new PenneoDocument();

            return document;
        }

        public async Task<CaseFileAttributes> GetCaseFileAttributes(int caseFileId) {
            string url = baseUrl + $"/casefiles/{caseFileId}/details";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            string responseContent = await response.Content.ReadAsStringAsync();
            CaseFileAttributes attributes = JsonConvert.DeserializeObject<CaseFileAttributes>(responseContent) ?? new CaseFileAttributes();

            return attributes;
        }

        public async Task CreateCaseFileAttribute(int caseFileId, string name, string value) {
            string url = baseUrl + $"/casefiles/{caseFileId}/attributes";
            object body = new {
                name, // must be lowercase in Penneo
                value,
            };

            HttpContent content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

            HttpResponseMessage response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
        }

        public async Task UpdateCaseFileAttribute(int caseFileId, int attributeId, string name, string value) {
            string url = baseUrl + $"/casefiles/{caseFileId}/attributes/{attributeId}";
            object body = new {
                name,
                value,
            };

            HttpContent content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

            HttpResponseMessage response = await _httpClient.PutAsync(url, content);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteCaseFileAttribute(int caseFileId, int attributeId) {
            string url = baseUrl + $"/casefiles/{caseFileId}/attributes/{attributeId}";
            HttpResponseMessage response = await _httpClient.DeleteAsync(url);
            response.EnsureSuccessStatusCode();
        }
    }
}
