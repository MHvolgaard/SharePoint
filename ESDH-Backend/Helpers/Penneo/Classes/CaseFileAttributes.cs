#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
#pragma warning disable IDE1006 // Naming Styles

namespace Helpers.Penneo.Classes {

    public class CaseFileAttributes {
        public List<Attribute> attributes { get; set; }
    }

    public class Attribute {
        public int id { get; set; }
        public string name { get; set; }
        public string value { get; set; }
    }
}

#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
#pragma warning restore IDE1006 // Naming Styles
