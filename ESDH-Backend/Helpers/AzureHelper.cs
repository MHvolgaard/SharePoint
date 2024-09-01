using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography.X509Certificates;

namespace Helpers {
    public static class AzureHelper {
        public static X509Certificate2 GetKeyVaultCertificate(string keyVaultUri, string certificateName) {
            var client = new SecretClient(new Uri(keyVaultUri), new DefaultAzureCredential());
            var keyVaultSecret = client.GetSecret(certificateName);

            return new X509Certificate2(Convert.FromBase64String(keyVaultSecret.Value.Value));
        }
    }
}
