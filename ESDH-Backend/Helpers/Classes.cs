#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.


using Newtonsoft.Json;

namespace Helpers {

    public class TemplatePayload {
        public string UserPrincipalName { get; set; }
        public string Type { get; set; }
        public string ListID { get; set; }
        public int ItemID { get; set; }
        public string DestinationFolderUrl { get; set; }
        public List<TemplatePayloadFile> SourceFiles { get; set; }
    }

    public class TemplatePayloadFile {
        public string FileName { get; set; }
        public string FileUrl { get; set; }
    }

    public class TemplateCreationResponse {
        public string FolderUrl { get; set; }
        public string FileUrl { get; set; }
    }

    //public class QueueItem {
    //    public string SiteUrl { get; set; }
    //    public string ListID { get; set; }
    //    public string EventType { get; set; }
    //    public int ItemID { get; set; }

    //    public void Validate() {
    //        if (this == null)
    //            throw new Exception("QueueItem is required.");
    //        if (string.IsNullOrWhiteSpace(SiteUrl))
    //            throw new Exception("SiteUrl is required.");
    //        if (string.IsNullOrWhiteSpace(ListID))
    //            throw new Exception("ListID is required.");
    //        if (ItemID < 1)
    //            throw new Exception("ItemID is required.");
    //        if (string.IsNullOrWhiteSpace(EventType))
    //            throw new Exception("EventType is required");
    //        if (EventType != "ItemAdded" && EventType != "ItemUpdated")
    //            throw new Exception($"EventType \"{EventType}\" has not been implemented.");
    //    }
    //}

    public class OpenSteetMap {
        public int place_id { get; set; }
        public string licence { get; set; }
        public string osm_type { get; set; }
        public int osm_id { get; set; }
        public string lat { get; set; }
        public string lon { get; set; }
        public string @class { get; set; }
        public string type { get; set; }
        public int place_rank { get; set; }
        public double importance { get; set; }
        public string addresstype { get; set; }
        public string name { get; set; }
        public string display_name { get; set; }
        public OpenSteetMapAddress address { get; set; }
        public List<string> boundingbox { get; set; }
    }

    public class OpenSteetMapAddress {
        public string house_number { get; set; }
        public string road { get; set; }
        public string town { get; set; }
        public string municipality { get; set; }
        public string state { get; set; }

        [JsonProperty("ISO3166-2-lvl4")]
        public string ISO31662lvl4 { get; set; }
        public string postcode { get; set; }
        public string country { get; set; }
        public string country_code { get; set; }
    }

    //--------------------------------------------------------------------------------

    public class PenneoToken {
        public string access_token { get; set; }
        public string token_type { get; set; }
        public int expires_in { get; set; }
        public int access_token_expires_at { get; set; }
    }


    //--------------------------------------------------------------------------------
    public class JsonListConfig {
        public string ListUrl { get; set; }
        public string ListName { get; set; }
        public List<JsonListUICulture> UICultures { get; set; }
        public int Template { get; set; }
        public List<JsonListSetting> Settings { get; set; }
        public List<JsonListField> Fields { get; set; }
        public JsonListPermission? Permissions { get; set; }
    }

    public class JsonListUICulture {
        public string Locale { get; set; }
        public string Value { get; set; }
    }

    public class JsonListSetting {
        public string Name { get; set; }
        public object Value { get; set; }
    }

    public class JsonListField {
        public string InternalName { get; set; }
        public string DisplayName { get; set; }
        public bool AddToDefaultView { get; set; }
        public string Type { get; set; }
        public List<JsonListSetting> Settings { get; set; }
        public List<JsonListUICulture> UICultures { get; set; }
        public string? LookupListName { get; set; }
        public string? LookupField { get; set; }
        public List<string>? Choices { get; set; }
        public string? TermSetName { get; set; }
    }

    public class JsonListPermission {
        public bool BreakRoleInheritance { get; set; }
        public bool CopyRoleAssignments { get; set; }
        public List<JsonListRole> Roles { get; set; }
    }

    public class JsonListRole {
        public string Principal { get; set; }
        public string RoleDefinition { get; set; }
    }






}
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.