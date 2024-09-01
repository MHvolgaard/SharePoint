#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
#pragma warning disable IDE1006 // Naming Styles

namespace Helpers.Penneo.Classes {

    public class PenneoDocument {
        public int caseFileId { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string documentId { get; set; }
        public int documentOrder { get; set; }
        public string title { get; set; }
        public int status { get; set; }
        public bool signable { get; set; }
        public List<object> signatureLines { get; set; }
        public string encryptionModeSigned { get; set; }
    }

    public class PenneoDocumentContent {
        public string content { get; set; }
    }
}

#pragma warning restore IDE1006 // Naming Styles
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.