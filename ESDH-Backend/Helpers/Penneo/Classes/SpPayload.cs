#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
#pragma warning disable IDE1006 // Naming Styles

namespace Helpers.Penneo.Classes {

    public class SpPayload {
        public string Token { get; set; }
        public string Hmac { get; set; }
        public string SiteUrl { get; set; }
        public string ListId { get; set; }
        public string CasefileName { get; set; }
        public string FolderUrl { get; set; }
        public List<SpPayloadFile> Files { get; set; }
    }

    public class SpPayloadFile {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ServerRelativeUrl { get; set; }
    }
}

#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
#pragma warning restore IDE1006 // Naming Styles
