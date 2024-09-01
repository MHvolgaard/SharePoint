#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
#pragma warning disable IDE1006 // Naming Styles

namespace Helpers.Penneo.Classes {

    public class CaseFile {
        public int userId { get; set; }
        public int customerId { get; set; }
        public List<Signer> signers { get; set; }
        public int caseFileTypeId { get; set; }
        public string caseFileTypeName { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string title { get; set; }
        public string metaData { get; set; }
        public int status { get; set; }
        public CaseFileType caseFileType { get; set; }
        public List<Document> documents { get; set; }
        public bool signOnMeeting { get; set; }
        public Customer customer { get; set; }
        public List<object> ccRecipients { get; set; }
        public int signIteration { get; set; }
        public int visibilityMode { get; set; }
        public int documentDisplayMode { get; set; }
        public bool sensitiveData { get; set; }
        public bool disableNotificationsOwner { get; set; }
        public bool disableEmailAttachments { get; set; }
        public int created { get; set; }
        public int activated { get; set; }
        public int updated { get; set; }
        public int completed { get; set; }
        public string encryptionModeSigned { get; set; }
        public string language { get; set; }
    }

    public class CaseFileType {
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string name { get; set; }
        public List<DocumentType> documentTypes { get; set; }
    }

    public class Customer {
        public List<string> allowedSigningMethods { get; set; }
        public List<object> allowedSimpleSigningMethods { get; set; }
        public string signerArchiveResponsibility { get; set; }
        public bool usersCanStoreContacts { get; set; }
        public bool allowSigningWithNap { get; set; }
        public int pipedriveId { get; set; }
        public int status { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string name { get; set; }
        public string address { get; set; }
        public string zip { get; set; }
        public string city { get; set; }
        public bool active { get; set; }
        public bool temporalStorageDefault { get; set; }
        public string vatin { get; set; }
        public bool accessControl { get; set; }
        public string language { get; set; }
        public bool adminAccess { get; set; }
        public bool overrideTemplates { get; set; }
        public bool transferOwnershipOnUserDelete { get; set; }
    }

    public class Document {
        public string options { get; set; }
        public int caseFileId { get; set; }
        public int documentTypeId { get; set; }
        public string documentType { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string documentId { get; set; }
        public int documentOrder { get; set; }
        public string title { get; set; }
        public Opts opts { get; set; }
        public int status { get; set; }
        public Type type { get; set; }
        public bool signable { get; set; }
        public List<SignatureLine> signatureLines { get; set; }
        public int created { get; set; }
        public int completed { get; set; }
        public string encryptionModeSigned { get; set; }
    }

    public class DocumentType {
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string name { get; set; }
        public int lowerLimit { get; set; }
        public int upperLimit { get; set; }
        public List<SignerType> signerTypes { get; set; }
    }

    public class Opts {
        public bool conditionalSigningEnabled { get; set; }
    }

    public class SignatureLine {
        public int signerId { get; set; }
        public int documentId { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string role { get; set; }
        public string signerTypeOriginalRole { get; set; }
        public int signOrder { get; set; }
        public int signedAt { get; set; }
        public int activatedAt { get; set; }
    }

    public class Signer {
        public string name { get; set; }
        public List<Type> types { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string validatedName { get; set; }
        public string ssnType { get; set; }
        public SigningRequest signingRequest { get; set; }
        public User user { get; set; }
        public bool storeAsContact { get; set; }
    }

    public class SignerType {
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string role { get; set; }
        public int lowerLimit { get; set; }
        public int upperLimit { get; set; }
        public int signOrder { get; set; }
    }

    public class SigningRequest {
        public List<object> insecureSigningMethods { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string email { get; set; }
        public string emailSubject { get; set; }
        public string emailText { get; set; }
        public string reminderEmailSubject { get; set; }
        public string reminderEmailText { get; set; }
        public string completedEmailSubject { get; set; }
        public string completedEmailText { get; set; }
        public string emailFormat { get; set; }
        public int status { get; set; }
        public int reminderInterval { get; set; }
        public bool accessControl { get; set; }
        public bool enableInsecureSigning { get; set; }
    }

    public class Type {
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string role { get; set; }
        public int lowerLimit { get; set; }
        public int upperLimit { get; set; }
    }

    public class Type2 {
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string name { get; set; }
        public int lowerLimit { get; set; }
        public int upperLimit { get; set; }
        public List<SignerType> signerTypes { get; set; }
    }

    public class User {
        public List<object> customerIds { get; set; }
        public List<object> teamIds { get; set; }
        public string sdkClassName { get; set; }
        public int id { get; set; }
        public string fullName { get; set; }
        public string email { get; set; }
        public string language { get; set; }
        public bool active { get; set; }
    }
}

#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
#pragma warning restore IDE1006 // Naming Styles