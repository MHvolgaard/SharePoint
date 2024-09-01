using Azure.Storage.Queues.Models;
using Helpers;
using Helpers.Penneo.Classes;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SharePoint.Client;
using Penneo;
using PnP.Framework;
using System.Security.Cryptography.X509Certificates;
using File = Microsoft.SharePoint.Client.File;

namespace ESDH_Backend {
    public class Timer_PenneoCheckStatus {
        private readonly ILogger _logger;
        private readonly IConfiguration _config;

        public Timer_PenneoCheckStatus(ILoggerFactory loggerFactory, IConfiguration config) {
            _logger = loggerFactory.CreateLogger<Timer_PenneoCheckStatus>();
            _config = config;
        }

        [Function("Timer_PenneoCheckStatus")]
        public async Task Run([TimerTrigger("0 0 */1 * * *", RunOnStartup = false)] TimerInfo myTimer) {
            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");


            //----------------------------------------------
            FunctionConfiguration config = new(_config);
            string attributeName = "esdh/folderurl"; // must be lowercase in Penneo

            //----------------------------------------------

            PenneoClient penneo = new(config.PenneoClientId, config.PenneoClientSecret, config.PenneoApiKey, config.PenneoApiSecret);
            await penneo.AuthenticateApi();
            _logger.LogInformation("Connected to Penneo");

            List<CaseFile> caseFiles = await penneo.GetCompletedCaseFilesByFolder(config.PenneoFolderId);
            if (caseFiles.Count == 0) {
                _logger.LogInformation("No completed case files found");
                return;
            }
            _logger.LogInformation($"Found {caseFiles.Count} completed case files");

            X509Certificate2 cert = AzureHelper.GetKeyVaultCertificate(config.KeyVaultUri, config.KeyVaultCertificateName);
            AuthenticationManager auth = new(config.ClientId, cert, config.TenantId);


            for (int i = 0; i < caseFiles.Count; i++) {
                CaseFile caseFile = caseFiles[i];

                CaseFileAttributes caseFileAttributes = await penneo.GetCaseFileAttributes(caseFile.id);
                string folderUrl = caseFileAttributes.attributes.Find(a => a.name == attributeName)?.value;

                Uri uri = new(SharePoint.GetSPUrl(config.TenantName) + folderUrl);
                string siteUrl = uri.Scheme + "://" + uri.Host + "/" + uri.Segments[1] + uri.Segments[2];

                await CopyFilesToSharePoint(auth, siteUrl, folderUrl, penneo, caseFile, config.PenneoFolderId, config.PenneoArchiveFolderId);

            }

            _logger.LogInformation("Done");
        }

        private async Task CopyFilesToSharePoint(AuthenticationManager auth, string siteUrl, string folderUrl, PenneoClient penneo, CaseFile caseFile, int penneoFolderId, int penneoArchiveFolderId) {
            using ClientContext ctx = SharePoint.LoadSPContext(auth, siteUrl);
            ctx.Load(ctx.Web, w => w.Url);
            ctx.ExecuteQuery();
            _logger.LogInformation($"Connected to SharePoint Online - {ctx.Web.Url}");

            Folder targetFolder = ctx.Web.GetFolderByServerRelativeUrl(folderUrl);

            foreach (var doc in caseFile.documents) {
                _logger.LogInformation($"Document: {doc.id} - {doc.title}");

                PenneoDocumentContent documentContent = await penneo.GetDocumentContent(doc.id);

                FileCreationInformation fci = new() {
                    Content = Convert.FromBase64String(documentContent.content),
                    Url = doc.title + ".pdf",
                    Overwrite = true,
                };
                File newFile = targetFolder.Files.Add(fci);
                ctx.Load(newFile, f => f.ListItemAllFields);
                ctx.ExecuteQuery();

                newFile.ListItemAllFields["esdhPenneoStatus"] = "Underskrevet";
                newFile.ListItemAllFields.UpdateOverwriteVersion();
                ctx.ExecuteQuery();

            }

            await penneo.LinkCaseFileToFolder(caseFile.id, penneoArchiveFolderId);
            await penneo.UnLinkCaseFileFromFolder(caseFile.id, penneoFolderId);
            _logger.LogInformation($"Case file: {caseFile.id} moved to archive folder: {penneoArchiveFolderId}");

        }
    }
}
