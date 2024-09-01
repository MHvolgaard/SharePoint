using DocumentFormat.OpenXml.Packaging;
using Microsoft.Extensions.Logging;

namespace Helpers {
    public static class Documents {


        public static void ReplaceDynamicText(string fileExtension, MemoryStream stream, Dictionary<string, string> documentFieldValues, ILogger logger) {
            if (fileExtension == null) return;
            string lowerFileExtension = fileExtension.Replace(".", "").ToLower();
            switch (lowerFileExtension) {
                //Word
                case "doc":
                case "docm":
                case "docx":
                case "docb":
                case "dotx":
                    logger.LogInformation("Replacing merge fields in Word document...");
                    WordReplaceMergeFields(stream, documentFieldValues);
                    return;

                //PDF
                case "pdf":
                    return;

                //Excel
                case "xlc":
                case "xls":
                case "xlsb":
                case "xlsm":
                case "xltm":
                case "xlsx":
                case "xlw":
                    logger.LogInformation("Replacing defined names in Excel document...");
                    ExcelReplaceDefinedNames(stream, documentFieldValues);
                    return;

                //PowerPoint
                case "ppt":
                case "pptm":
                case "pptx":
                case "sldx":
                case "sldm":
                    return;

                //Images
                case "png":
                case "jpg":
                case "jpeg":
                    return;

                //EMail
                case "msg":
                case "eml":
                    return;

                default:
                    return;
            }
        }

        private static void WordReplaceMergeFields(MemoryStream stream, Dictionary<string, string> documentFieldValues) {
            WordprocessingDocument wordDoc = WordprocessingDocument.Open(stream, true);

            var mergeFields = wordDoc.GetMergeFields().ToList();

            foreach (var field in mergeFields) {
                string fieldName = field.InnerText.Replace("MERGEFIELD", string.Empty).Replace("\\* MERGEFORMAT", string.Empty).Trim();

                if (documentFieldValues.ContainsKey(fieldName)) {
                    field.ReplaceWithText(documentFieldValues[fieldName]);
                }
            }

            wordDoc.Save();
            wordDoc.Dispose();
        }

        private static void ExcelReplaceDefinedNames(MemoryStream stream, Dictionary<string, string> documentFieldValues) {
            SpreadsheetDocument document = SpreadsheetDocument.Open(stream, true);
            var definedNames = document.WorkbookPart?.Workbook.DefinedNames;
            if (definedNames == null) return;

            foreach (DocumentFormat.OpenXml.Spreadsheet.DefinedName definedName in definedNames) {
                string fieldName = definedName.Name?.ToString();

                if (documentFieldValues.ContainsKey(fieldName)) {
                    definedName.Text = "\"" + documentFieldValues[fieldName] + "\"";
                }
            }

            document.WorkbookPart?.Workbook.Save();

            document.WorkbookPart.Workbook.CalculationProperties.ForceFullCalculation = true;
            document.WorkbookPart.Workbook.CalculationProperties.FullCalculationOnLoad = true;
            document.Dispose();

        }

        //public static void ReplaceDynamicText(string fileExtension, MemoryStream stream, ListItem item, Dictionary<string, string> fieldMappings, Dictionary<string, string> fieldTypeMappings, ILogger logger) {
        //    if (fileExtension == null) return;
        //    string lowerFileExtension = fileExtension.Replace(".", "").ToLower();
        //    switch (lowerFileExtension) {
        //        //Word
        //        case "doc":
        //        case "docm":
        //        case "docx":
        //        case "docb":
        //        case "dotx":
        //            logger.LogInformation("Replacing merge fields in Word document...");
        //            WordReplaceMergeFields(stream, item, fieldMappings, fieldTypeMappings);
        //            return;

        //        //PDF
        //        case "pdf":
        //            return;

        //        //Excel
        //        case "xlc":
        //        case "xls":
        //        case "xlsb":
        //        case "xlsm":
        //        case "xltm":
        //        case "xlsx":
        //        case "xlw":
        //            logger.LogInformation("Replacing defined names in Excel document...");
        //            ExcelReplaceDefinedNames(stream, item, fieldMappings, fieldTypeMappings);
        //            return;

        //        //PowerPoint
        //        case "ppt":
        //        case "pptm":
        //        case "pptx":
        //        case "sldx":
        //        case "sldm":
        //            return;

        //        //Images
        //        case "png":
        //        case "jpg":
        //        case "jpeg":
        //            return;

        //        //EMail
        //        case "msg":
        //        case "eml":
        //            return;

        //        default:
        //            return;
        //    }
        //}

        //private static void WordReplaceMergeFields(MemoryStream stream, ListItem item, Dictionary<string, string> fieldMappings, Dictionary<string, string> fieldTypeMappings) {
        //    WordprocessingDocument wordDoc = WordprocessingDocument.Open(stream, true);

        //    var mergeFields = wordDoc.GetMergeFields().ToList();

        //    foreach (var field in mergeFields) {
        //        string fieldName = field.InnerText.Replace("MERGEFIELD", string.Empty).Replace("\\* MERGEFORMAT", string.Empty).Trim();

        //        string? value = ToStringFieldValue(fieldName, item, fieldMappings, fieldTypeMappings);
        //        if (value != null) {
        //            field.ReplaceWithText(value);
        //        }

        //        //if (fieldMappings.TryGetValue(fieldName, out string? spInternalName)) {

        //        //    switch (fieldTypeMappings[spInternalName]) {
        //        //        case "Text":
        //        //            field.ReplaceWithText(item.GetFieldValueAs<string>(spInternalName));
        //        //            break;
        //        //        case "DateTime":
        //        //            field.ReplaceWithText(item.GetFieldValueAs<DateTime?>(spInternalName)?.ToString("yyyy-MM-dd", new CultureInfo("da-dk", true)) ?? "");
        //        //            break;
        //        //        case "User":
        //        //            field.ReplaceWithText(item.GetFieldValueAs<FieldUserValue>(spInternalName)?.LookupValue ?? "");
        //        //            break;
        //        //        case "Lookup":
        //        //            field.ReplaceWithText(item.GetFieldValueAs<FieldLookupValue>(spInternalName)?.LookupValue ?? "");
        //        //            break;
        //        //        case "Number":
        //        //            field.ReplaceWithText(item.GetFieldValueAs<double>(spInternalName).ToString());
        //        //            break;
        //        //        case "Boolean":
        //        //            field.ReplaceWithText(item.GetFieldValueAs<bool>(spInternalName).ToString());
        //        //            break;
        //        //        default:
        //        //            field.ReplaceWithText("Unknown field type");
        //        //            break;
        //        //    }
        //        //}
        //    }

        //    wordDoc.Save();
        //    wordDoc.Dispose();
        //}

        //private static void ExcelReplaceDefinedNames(MemoryStream stream, ListItem item, Dictionary<string, string> fieldMappings, Dictionary<string, string> fieldTypeMappings) {
        //    SpreadsheetDocument document = SpreadsheetDocument.Open(stream, true);
        //    var definedNames = document.WorkbookPart?.Workbook.DefinedNames;
        //    if (definedNames == null) return;

        //    foreach (DocumentFormat.OpenXml.Spreadsheet.DefinedName definedName in definedNames) {
        //        string fieldName = definedName.Name?.ToString();

        //        string? value = ToStringFieldValue(fieldName, item, fieldMappings, fieldTypeMappings);
        //        if (value != null) {
        //            definedName.Text = "\"" + value + "\""; // Excel requires text to be wrapped in quotes
        //        }
        //    }

        //    document.WorkbookPart?.Workbook.Save();

        //    document.WorkbookPart.Workbook.CalculationProperties.ForceFullCalculation = true;
        //    document.WorkbookPart.Workbook.CalculationProperties.FullCalculationOnLoad = true;
        //    document.Dispose();

        //}

        //private static string? ToStringFieldValue(string fieldName, ListItem item, Dictionary<string, string> fieldMappings, Dictionary<string, string> fieldTypeMappings) {
        //    if (fieldMappings.TryGetValue(fieldName, out string? spInternalName)) {
        //        switch (fieldTypeMappings[spInternalName]) {
        //            case "Text":
        //                return item.GetFieldValueAs<string>(spInternalName);
        //            case "DateTime":
        //                return item.GetFieldValueAs<DateTime?>(spInternalName)?.ToString("yyyy-MM-dd", new CultureInfo("da-dk", true)) ?? "";
        //            case "User":
        //                return item.GetFieldValueAs<FieldUserValue>(spInternalName)?.LookupValue ?? "";
        //            case "Lookup":
        //                return item.GetFieldValueAs<FieldLookupValue>(spInternalName)?.LookupValue ?? "";
        //            case "Number":
        //                return item.GetFieldValueAs<double>(spInternalName).ToString();
        //            case "Boolean":
        //                return item.GetFieldValueAs<bool>(spInternalName).ToString();
        //            default:
        //                return "Unknown field type";
        //        }
        //    }
        //    return null;
        //}
    }
}
