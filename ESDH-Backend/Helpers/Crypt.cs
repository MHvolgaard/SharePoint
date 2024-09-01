using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Helpers {
    public static class Crypt {

        public static string Decrypt(string encryptedText, string keyString) {
            var key = Encoding.UTF8.GetBytes(keyString);

            using var aes = Aes.Create();
            aes.Key = key;
            aes.Mode = CipherMode.ECB;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            var buffer = Convert.FromBase64String(encryptedText);
            var result = decryptor.TransformFinalBlock(buffer, 0, buffer.Length);
            return Encoding.UTF8.GetString(result);
        }

        public static bool VerifyHMAC(string token, string sentHmac, string hmacKeyString) {
            var key = Encoding.UTF8.GetBytes(hmacKeyString);

            using var hmac = new HMACSHA256(key);
            var computedHmac = hmac.ComputeHash(Encoding.UTF8.GetBytes(token));
            var computedHmacString = BitConverter.ToString(computedHmac).Replace("-", "").ToLower();

            // Compare the HMAC provided by the client with the computed one
            return sentHmac.Equals(computedHmacString, StringComparison.OrdinalIgnoreCase);
        }
    }
}
