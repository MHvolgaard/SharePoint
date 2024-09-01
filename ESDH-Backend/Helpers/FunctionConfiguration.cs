using Microsoft.Extensions.Configuration;

#pragma warning disable CS8601 // Possible null reference assignment.
namespace Helpers {
    public class FunctionConfiguration(IConfiguration config) {

        public string AzureWebJobsStorage { get; set; } = config["AzureWebJobsStorage"];

        public string KeyVaultUri { get; set; } = config["KeyVault:Uri"];
        public string KeyVaultCertificateName { get; set; } = config["KeyVault:CertificateName"];

        public string TenantId { get; set; } = config["AAD:TenantId"];
        public string ClientId { get; set; } = config["AAD:ClientId"];

        public string HubSiteUrl { get; set; } = config["SPO:HubSiteUrl"];
        public string EsdhSiteUrl { get; set; } = config["SPO:ESDHSiteUrl"];
        public string TenantName { get; set; } = config["SPO:TenantName"];
        public string DefaultSiteOwner { get; set; } = config["SPO:DefaultSiteOwner"];
        public Guid CustomerListGuid { get; set; } = new Guid(config["SPO:CustomerListGuid"]);
        public Guid CaseListGuid { get; set; } = new Guid(config["SPO:CaseListGuid"]);
        public Guid EmployeeListGuid { get; set; } = new Guid(config["SPO:EmployeeListGuid"]);
        public Guid TemplateLibraryGuid { get; set; } = new Guid(config["SPO:TemplateLibraryGuid"]);
        public Guid FolderTemplateLibraryGuid { get; set; } = new Guid(config["SPO:FolderTemplateLibraryGuid"]);
        public Guid FieldMappingListGuid { get; set; } = new Guid(config["SPO:FieldMappingListGuid"]);
        public string AdminGroup { get; set; } = config["SPO:AdminGroup"];
        public string MemberGroup { get; set; } = config["SPO:MemberGroup"];
        public string ThemeName { get; set; } = config["SPO:ThemeName"];
        public string SiteLogoUrl { get; set; } = config["SPO:SiteLogoUrl"];

        public string PenneoClientId { get; set; } = config["Penneo:ClientId"];
        public string PenneoClientSecret { get; set; } = config["Penneo:ClientSecret"];
        public string PenneoApiKey { get; set; } = config["Penneo:ApiKey"];
        public string PenneoApiSecret { get; set; } = config["Penneo:ApiSecret"];
        public int PenneoFolderId { get; set; } = Convert.ToInt32(config["Penneo:FolderId"]);
        public int PenneoArchiveFolderId { get; set; } = Convert.ToInt32(config["Penneo:ArchiveFolderId"]);
    }
}

#pragma warning restore CS8601 // Possible null reference assignment.