using DocumentFormat.OpenXml.Office.CustomUI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Online.SharePoint.TenantAdministration;
using Microsoft.SharePoint.Client;
using PnP.Framework.ALM;
using PnP.Framework.Diagnostics;
using PnP.Framework.Utilities.Themes;
using RateLimitDemo;
using System.Globalization;
using System.Security.Cryptography.X509Certificates;
using AuthenticationManager = PnP.Framework.AuthenticationManager;
using File = Microsoft.SharePoint.Client.File;
using Group = Microsoft.SharePoint.Client.Group;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Helpers {
    public static class SharePoint {

        public static ClientContext LoadSPContext(AuthenticationManager auth, string siteUrl) {
            ClientContext ctx = auth.GetContext(siteUrl);
            HttpClient client = new(new ThrottlingHandler() {
                InnerHandler = new HttpClientHandler()
            });
            ctx.WebRequestExecutorFactory = new HttpClientWebRequestExecutorFactory(client);

            return ctx;
        }

        //public static ClientContext LoadSPAppContext(string siteUrl, IConfiguration config, X509Certificate2 cert) {
        //    AuthenticationManager auth = new(config["AAD:ClientId"], cert, config["AAD:TenantId"]);
        //    ClientContext ctx = auth.GetContext(siteUrl);
        //    HttpClient client = new(new ThrottlingHandler() {
        //        InnerHandler = new HttpClientHandler()
        //    });
        //    ctx.WebRequestExecutorFactory = new HttpClientWebRequestExecutorFactory(client);

        //    return ctx;
        //}

        //public static ClientContext LoadInteractiveContext(string siteUrl) {
        //    AuthenticationManager auth = AuthenticationManager.CreateWithInteractiveLogin("31359c7f-bd7e-475c-86db-fdb8c937548e"); // PnP Management Shell

        //    ClientContext ctx = auth.GetContext(siteUrl);
        //    HttpClient client = new(new ThrottlingHandler() {
        //        InnerHandler = new HttpClientHandler()
        //    });
        //    ctx.WebRequestExecutorFactory = new HttpClientWebRequestExecutorFactory(client);

        //    return ctx;
        //}
        public static string GetSPUrl(string tenantName) {
            return $"https://{tenantName}.sharepoint.com";
        }

        public static string GetESDHSiteUrl(string tenantName) {
            return $"https://{tenantName}.sharepoint.com/sites/ESDH";
        }

        public static string GetESDHAdminSiteUrl(string tenantName) {
            return $"https://{tenantName}.sharepoint.com/sites/ESDHAdmin";
        }

        public static void EnsureSite(ClientContext ctx, Tenant tenant, string siteUrl, string siteName, string ownerUpn, ILogger? log = null) {
            var siteExistance = tenant.SiteExistsAnywhere(siteUrl);
            switch (siteExistance) {
                case SiteExistence.No:
                    CreateSite(ctx, tenant, siteUrl, siteName, ownerUpn, log);
                    break;
                case SiteExistence.Recycled:
                    RestoreSite(ctx, tenant, siteUrl, log);
                    break;
                default:
                    if (log != null) log.LogInformation($"Site already exsist, continuing: {siteUrl}");
                    else Console.WriteLine($"Site already exsist, continuing: {siteUrl}");

                    break;
            }
        }

        public static void ConnectToHubSite(ClientContext ctx, Tenant tenant, string siteUrl, string hubSiteUrl, ILogger logger) {
            if (string.IsNullOrWhiteSpace(hubSiteUrl)) {
                logger.LogInformation("Hub site URL is empty");
                return;
            }
            var hubSite = tenant.GetSiteByUrl(hubSiteUrl);
            ctx.Load(hubSite);
            ctx.ExecuteQuery();

            if (!hubSite.IsHubSite) {
                logger.LogWarning($"Site {hubSiteUrl} is not a hub site");
                return;
            }

            tenant.ConnectSiteToHubSite(siteUrl, hubSiteUrl);
            ctx.ExecuteQuery();
        }

        private static void CreateSite(ClientContext ctx, Tenant tenant, string siteUrl, string siteName, string ownerUpn, ILogger? log) {
            var spo = tenant.CreateSite(new SiteCreationProperties {
                Url = siteUrl,
                Title = siteName,
                Owner = ownerUpn,
                Template = "SITEPAGEPUBLISHING#0", // Communication site - https://www.sharepointdiary.com/2017/08/get-site-template-in-sharepoint-online-using-powershell.html
                Lcid = 1033, // English - https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-csom/jj167546(v=office.15)/
                TimeZoneId = 3, // (GMT+01:00) Brussels, Copenhagen, Madrid, Paris - https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-csom/jj171282(v=office.15)/
            });
            ctx.Load(spo, s => s.IsComplete);
            ctx.ExecuteQuery();

            do {
                // Wait for 3 seconds and then try again
                Thread.Sleep(3000);
                if (log != null) log.LogInformation($"Polling creation site: {siteUrl}");
                else Console.WriteLine($"Polling creation site: {siteUrl}");


                spo.RefreshLoad();
                ctx.ExecuteQuery();
            } while (!spo.IsComplete);

            if (log != null) log.LogInformation($"Site created: {siteUrl}");
            else Console.WriteLine();

        }

        private static void RestoreSite(ClientContext ctx, Tenant tenant, string siteUrl, ILogger? log) {
            var spo = tenant.RestoreDeletedSite(siteUrl);
            ctx.Load(spo, s => s.IsComplete);
            ctx.ExecuteQuery();

            do {
                // Wait for 3 seconds and then try again
                Thread.Sleep(3000);
                if (log != null) log.LogInformation($"Pooling restoration site: {siteUrl}");
                else Console.WriteLine($"Pooling restoration site: {siteUrl}");

                spo.RefreshLoad();
                ctx.ExecuteQuery();
            } while (!spo.IsComplete);

            if (log != null) log.LogInformation($"Site restored from recycle bin: {siteUrl}");
            else Console.WriteLine($"Site restored from recycle bin: {siteUrl}");
        }

        public static void SetSiteTheme(ClientContext ctx, Tenant tenant, string siteUrl, string themeName, ILogger log) {
            var theme = tenant.GetTenantTheme(themeName);
            ctx.Load(theme);
            ctx.ExecuteQuery();
            if (theme != null) {
                tenant.SetWebTheme(themeName, siteUrl);
                ctx.ExecuteQuery();
            } else {
                log.LogWarning($"Theme {themeName} not found");
            }
        }

        public static void SetSiteProperties(ClientContext ctx, string esdhSiteUrl, Guid customerListGuid, int itemID, Guid templateListID, string type) {
            // This works now but Microsoft is tightening security and this might not work in the future
            //ctx.Web.SetPropertyBagValue("esdhSite", queueItem.SiteUrl);
            //ctx.Web.SetPropertyBagValue("esdhListID", queueItem.ListID);
            //ctx.Web.SetPropertyBagValue("esdhItemID", queueItem.ItemID);
            //ctx.Web.Update();
            //ctx.ExecuteQuery();
            string listTitle = "Properties";
            bool listExists = ctx.Web.ListExists(listTitle);
            if (!listExists) {
                ctx.Web.Lists.Add(new ListCreationInformation {
                    Title = listTitle,
                    TemplateType = (int)ListTemplateType.GenericList
                });
                ctx.ExecuteQuery();
            }

            // Hide the list
            List settingsList = ctx.Web.Lists.GetByTitle(listTitle);
            settingsList.Hidden = true;
            settingsList.Update();
            ctx.Load(settingsList);
            ctx.ExecuteQuery();

            FieldCollection fields = settingsList.Fields;
            ctx.Load(fields);
            ctx.ExecuteQuery();

            // Set Title to hidden and not required
            Field titleField = fields.GetByInternalNameOrTitle("Title");
            titleField.Required = false;
            titleField.Hidden = true;
            titleField.DefaultValue = listTitle;
            titleField.Update();
            ctx.ExecuteQuery();

            // Add fields if they don't exist
            string esdhSiteInternalName = "esdhSite";
            if (!fields.Any(f => f.InternalName == esdhSiteInternalName)) {
                var newField = settingsList.Fields.AddFieldAsXml($"<Field Name='{esdhSiteInternalName}' StaticName='{esdhSiteInternalName}' DisplayName='ESDH Site' Type='Text' />", true, AddFieldOptions.AddFieldInternalNameHint);
                newField.Required = true;
                newField.Update();
                ctx.Load(fields);
                ctx.ExecuteQuery();
            }

            string listIDInternalName = "esdhListID";
            if (!fields.Any(f => f.InternalName == listIDInternalName)) {
                var newField = settingsList.Fields.AddFieldAsXml($"<Field Name='{listIDInternalName}' StaticName='{listIDInternalName}' DisplayName='ESDH List ID' Type='Text' />", true, AddFieldOptions.AddFieldInternalNameHint);
                newField.Required = true;
                newField.Update();
                ctx.Load(fields);
                ctx.ExecuteQuery();
            }

            string itemIDInternalName = "esdhItemID";
            if (!fields.Any(f => f.InternalName == itemIDInternalName)) {
                var newField = settingsList.Fields.AddFieldAsXml($"<Field Name='{itemIDInternalName}' StaticName='{itemIDInternalName}' DisplayName='ESDH Item ID' Type='Text' />", true, AddFieldOptions.AddFieldInternalNameHint);
                newField.Required = true;
                newField.Update();
                ctx.Load(fields);
                ctx.ExecuteQuery();
            }

            //string esdhAdminSiteInternalName = "esdhAdminSite";
            //if (!fields.Any(f => f.InternalName == esdhAdminSiteInternalName)) {
            //    var newField = settingsList.Fields.AddFieldAsXml($"<Field Name='{esdhAdminSiteInternalName}' StaticName='{esdhAdminSiteInternalName}' DisplayName='ESDH Admin Site' Type='Text' />", true, AddFieldOptions.AddFieldInternalNameHint);
            //    newField.Required = true;
            //    newField.Update();
            //    ctx.Load(fields);
            //    ctx.ExecuteQuery();
            //}

            string templateListIDInternalName = "esdhTemplateListID";
            if (!fields.Any(f => f.InternalName == templateListIDInternalName)) {
                var newField = settingsList.Fields.AddFieldAsXml($"<Field Name='{templateListIDInternalName}' StaticName='{templateListIDInternalName}' DisplayName='ESDH Template List ID' Type='Text' />", true, AddFieldOptions.AddFieldInternalNameHint);
                newField.Required = true;
                newField.Update();
                ctx.Load(fields);
                ctx.ExecuteQuery();
            }

            string typeInternalName = "esdhType";
            if (!fields.Any(f => f.InternalName == typeInternalName)) {
                var newField = settingsList.Fields.AddFieldAsXml($"<Field Name='{typeInternalName}' StaticName='{typeInternalName}' DisplayName='ESDH Type' Type='Text' />", true, AddFieldOptions.AddFieldInternalNameHint);
                newField.Required = true;
                newField.Update();
                ctx.Load(fields);
                ctx.ExecuteQuery();
            }

            // Update the list item and remove all other items
            ListItemCollection listItems = settingsList.GetItems(CamlQuery.CreateAllItemsQuery());
            ctx.Load(listItems);
            ctx.ExecuteQuery();

            ListItem settingsItem;
            if (listItems.Count > 0) {
                settingsItem = listItems[0];

                for (int i = 1; i < listItems.Count; i++) {
                    listItems[i].DeleteObject();
                }
                ctx.ExecuteQuery();
            } else {
                settingsItem = settingsList.AddItem(new ListItemCreationInformation());
            }

            settingsItem[esdhSiteInternalName] = esdhSiteUrl;
            settingsItem[listIDInternalName] = customerListGuid.ToString();
            settingsItem[itemIDInternalName] = itemID.ToString();
            //settingsItem[esdhAdminSiteInternalName] = controlSiteUrl;
            settingsItem[templateListIDInternalName] = templateListID.ToString();
            settingsItem[typeInternalName] = type;
            settingsItem.Update();
            ctx.ExecuteQuery();
        }

        public static void SetRegionalSettings(ClientContext ctx) {
            ctx.Web.IsMultilingual = true;
            ctx.Web.AddSupportedUILanguage(1030);
            ctx.Web.Update();
            ctx.ExecuteQuery();

            ctx.Load(ctx.Web.RegionalSettings);
            ctx.Load(ctx.Web.RegionalSettings, r => r.TimeZones);
            ctx.ExecuteQuery();


            ctx.Web.RegionalSettings.LocaleId = 1030; // Danish - https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-csom/jj167546(v=office.15)/
            ctx.Web.RegionalSettings.TimeZone = ctx.Web.RegionalSettings.TimeZones.FirstOrDefault(t => t.Id == 3); // (GMT+01:00) Brussels, Copenhagen, Madrid, Paris
            ctx.Web.RegionalSettings.Time24 = true;
            ctx.Web.RegionalSettings.WorkDayStartHour = 8;
            ctx.Web.RegionalSettings.WorkDayEndHour = 16;
            ctx.Web.RegionalSettings.WorkDays = 62; // Monday - Friday
            ctx.Web.RegionalSettings.CalendarType = 1; // Gregorian
            ctx.Web.RegionalSettings.FirstDayOfWeek = 1; // Monday
            ctx.Web.RegionalSettings.FirstWeekOfYear = 2; // First 4-day week
            ctx.Web.RegionalSettings.ShowWeeks = true;
            ctx.Web.RegionalSettings.Collation = 9; // Sort order: Danish/Norwegian

            ctx.Web.FooterEnabled = false;
            ctx.Web.Update();
            ctx.ExecuteQuery();
        }

        //public static List<string> GetPermissionMembers(ClientContext ctx, string listGuid, string customerNumber) {
        //    List permissionsList = ctx.Web.Lists.GetById(new Guid(listGuid));
        //    ctx.Load(permissionsList);
        //    ctx.ExecuteQuery();

        //    CamlQuery query = new() {
        //        ViewXml = $@"<View>
        //            <Query>
        //                <Where>
        //                    <Eq>
        //                        <FieldRef Name='esdhCustomerNumber'/>
        //                        <Value Type='Text'>{customerNumber}</Value>
        //                    </Eq>
        //                </Where>
        //            </Query>
        //        </View>"
        //    };

        //    ListItemCollection permissionItems = permissionsList.GetItems(query);
        //    ctx.Load(permissionItems);
        //    ctx.ExecuteQuery();

        //    return [.. permissionItems.Select(p => p.GetFieldValueAs<string>("esdhUser"))];// TODO change field from initials to email/login and create sync accordingly
        //}

        //public static void SetPermissions(ClientContext esdhCtx, ClientContext siteCtx, IConfiguration config, ListItem item, List<string> members) {
        public static void SetSitePermissions(ClientContext esdhCtx, ClientContext siteCtx, string adminGroupName, string memberGroupName) {
            // site permissions
            siteCtx.Load(siteCtx.Web, w => w.SiteGroups.Include(item => item.Users, item => item.Title));
            siteCtx.ExecuteQuery();

            Group ownerGroup = siteCtx.Web.SiteGroups.FirstOrDefault(g => g.Title.EndsWith("Owners"));
            List<string> owners = [
               adminGroupName
            ];
            SetGroupUsers(siteCtx, ownerGroup, owners);

            Group memberGroup = siteCtx.Web.SiteGroups.FirstOrDefault(g => g.Title.EndsWith("Visitors"));
            List<string> members = [
                memberGroupName
            ];
            SetGroupUsers(siteCtx, memberGroup, members);

            //// list item permissions
            //item.ResetRoleInheritance();
            //item.BreakRoleInheritance(false, true); // break role inheritance and clear permissions

            //RoleDefinition fullControlRD = esdhCtx.Web.RoleDefinitions.GetById(1073741829); // Full Control
            //RoleDefinitionBindingCollection fullControlRDBC = new(esdhCtx) {
            //    fullControlRD
            //};
            //RoleDefinition readRD = esdhCtx.Web.RoleDefinitions.GetById(1073741826); // Read
            //RoleDefinitionBindingCollection readRDBC = new(esdhCtx) {
            //    readRD
            //};
            //item.RoleAssignments.Add(esdhCtx.Web.EnsureUser(config["SPO:AdminGroup"]), fullControlRDBC);
            //item.Update();

            //for (int i = 0; i < members.Count; i++) {
            //    item.RoleAssignments.Add(esdhCtx.Web.EnsureUser(members[i]), readRDBC);
            //    item.Update();
            //}
            //item.RefreshLoad();
            //esdhCtx.ExecuteQuery();

        }

        public static (string, List<ListItem>) GetAllFromPath(ClientContext ctx, Guid listID, string folderName = "") {
            List docLib = ctx.Web.Lists.GetById(listID);
            ctx.Load(docLib, d => d.RootFolder.ServerRelativeUrl);
            ctx.ExecuteQuery();

            // check if list has field "esdhPermissions"


            string folderServerRelativeUrl = docLib.RootFolder.ServerRelativeUrl;
            if (!string.IsNullOrEmpty(folderName)) {
                folderServerRelativeUrl += "/" + folderName;
            }

            List<ListItem> items = docLib.GetAllItems(folderServerRelativeUrl);

            items = items.OrderBy(i => i["FileDirRef"].ToString()).ToList();

            return (docLib.RootFolder.ServerRelativeUrl, items);
        }

        public static List<ListItem> GetAllItems(this List list, string? folderServerRelativeUrl = null) {
            bool keepWorking = true;
            ListItemCollectionPosition? position = null;
            List<ListItem> completeListItems = new();
            while (keepWorking) {
                CamlQuery cq = new() {
                    ListItemCollectionPosition = position,
                    ViewXml = @"<View Scope='RecursiveAll'>
                        <Query>
							<OrderBy><FieldRef Name='ID' Ascending='TRUE'/></OrderBy>
						</Query>
						<RowLimit Paged='TRUE'>5000</RowLimit>
					</View>"
                };
                if (folderServerRelativeUrl != null) {
                    cq.AllowIncrementalResults = true;
                    cq.FolderServerRelativeUrl = folderServerRelativeUrl;
                }

                ListItemCollection listItemColl = list.GetItems(cq);
                list.Context.Load(listItemColl);
                list.Context.Load(listItemColl,
                    items => items.Include(
                        item => item.Id,
                        item => item.DisplayName,
                        item => item.Folder,
                        item => item.File,
                        item => item.ContentType
                        ));
                list.Context.ExecuteQueryRetry();

                completeListItems.AddRange(listItemColl.ToList());

                position = listItemColl.ListItemCollectionPosition;
                if (position == null) {
                    keepWorking = false;
                }
            }
            return completeListItems;
        }

        public static void CopyFromSource(ClientContext sourceCtx, ClientContext targetCtx, List<ListItem> source, List<ListItem> target, string sourceRoot, string targetRoot, string adminGroupName, string memberGroupName, ILogger logEvent) {
            foreach (ListItem sourceItem in source) {
                bool itemExist = false;
                string? targetFileRef = sourceItem["FileRef"].ToString()?.Replace(sourceRoot, targetRoot);
                string? targetFileDirRef = sourceItem["FileDirRef"].ToString()?.Replace(sourceRoot, targetRoot);
                string? targetFileLeafRef = sourceItem["FileLeafRef"].ToString();

                if (targetFileRef == null) continue;
                ListItem? targetItem = target.FirstOrDefault(t => t["FileRef"].ToString() == targetFileRef);

                if (targetItem != null) itemExist = true;

                if (!itemExist) {
                    switch (sourceItem.ContentType.Name) {
                        case "Folder":
                        case "Mappe":
                            targetItem = CopyFolder(targetCtx, targetFileLeafRef, targetFileDirRef, logEvent, sourceItem, adminGroupName);
                            break;

                        case "Document":
                        case "Dokument":
                            CopyFile(sourceCtx, targetCtx, sourceItem["FileRef"].ToString(), targetFileDirRef, logEvent);
                            break;

                        default:
                            logEvent.LogWarning("Unexpected ContentType. Could not copy");
                            break;
                    }
                }

                SetFolderPermissions(targetCtx, targetItem, sourceItem, adminGroupName, memberGroupName);
            }
        }

        private static void SetGroupUsers(ClientContext ctx, Group group, List<string> users) {
            for (int i = 0; i < users.Count; i++) {
                User user = group.Users.FirstOrDefault(u => u.Title == users[i]); // TODO change field from initials to email/login and create sync accordingly
                if (user == null) {
                    group.Users.AddUser(ctx.Web.EnsureUser(users[i]));
                }
            }
            group.RefreshLoad();
            ctx.ExecuteQuery();

            for (int i = 0; i < group.Users.Count; i++) {
                try {
                    string identifier = group.Users[i].Email;
                    if (string.IsNullOrEmpty(identifier)) {
                        identifier = group.Users[i].Title;
                    }
                    if (identifier == "System Account") continue; // Skip system account

                    string permission = users.FirstOrDefault(p => p == identifier);
                    if (string.IsNullOrEmpty(permission)) {
                        group.Users.Remove(group.Users[i]);
                    }
                } catch (Exception e) {
                    if (e.HResult != -2146233079) { // The property or field '{Email or Title}' has not been initialized. - This seems to be some sort of system account so we just ignore it and move on
                        throw;
                    }
                }
            }
            group.RefreshLoad();
            ctx.ExecuteQuery();
        }

        private static ListItem? CopyFolder(ClientContext targetCtx, string? name, string? path, ILogger logEvent, ListItem sourceItem, string adminGroupName) {
            if (name == null || path == null) {
                Console.WriteLine("Failed to get name or path");
                return null;
            }

            try {
                Folder? parentFolder = targetCtx.Web.GetFolderByServerRelativeUrl(path);
                targetCtx.Load(parentFolder, p => p.Folders);
                targetCtx.ExecuteQuery();

                Folder newFolder = parentFolder.Folders.Add(name);
                targetCtx.Load(newFolder);
                targetCtx.ExecuteQuery();

                return newFolder.ListItemAllFields;

            } catch (Exception) {
                logEvent.LogError($"Failed to add folder {name} in path {path}. Parent may be missing");
                return null;
            }
        }

        private static void SetFolderPermissions(ClientContext ctx, ListItem targetItem, ListItem sourceItem, string adminGroupName, string memberGroupName) {
            targetItem.ResetRoleInheritance();
            ctx.ExecuteQuery();

            string editGroupName = memberGroupName;
            var permission = sourceItem.GetFieldValueAs<FieldUserValue>("esdhPermissions");
            if (permission != null) {
                editGroupName = permission.LookupValue;
            }

            targetItem.BreakRoleInheritance(false, true);
            RoleDefinitionBindingCollection editRDBC = new(ctx) {
                    ctx.Web.RoleDefinitions.GetByType(RoleType.Editor)
                };
            RoleDefinitionBindingCollection fullControlRDBC = new(ctx) {
                    ctx.Web.RoleDefinitions.GetByType(RoleType.Administrator)
                };
            targetItem.RoleAssignments.Add(ctx.Web.EnsureUser(editGroupName), editRDBC);
            targetItem.RoleAssignments.Add(ctx.Web.EnsureUser(adminGroupName), fullControlRDBC);
            targetItem.Update();
            ctx.ExecuteQuery();
        }

        private static void CopyFile(ClientContext sourceCtx, ClientContext targetCtx, string? fileUrl, string? targetLocation, ILogger logEvent) {
            if (fileUrl == null || targetLocation == null) {
                Console.WriteLine("Failed to get FileUrl or TargetLocation");
                return;
            }
            File? sourceFile = sourceCtx.Web.GetFileByServerRelativeUrl(fileUrl);
            sourceCtx.Load(sourceFile);
            ClientResult<Stream> mstream = sourceFile.OpenBinaryStream();
            sourceCtx.ExecuteQuery();

            Folder? targetFolder = targetCtx.Web.GetFolderByServerRelativeUrl(targetLocation);
            targetCtx.Load(targetFolder, tf => tf.Files);

            if (targetFolder == null || sourceFile == null) {
                Console.WriteLine("Failed to get targetFolder or sourceFile");
                return;
            }

            //if (findFileInTargetFolder == null) {
            try {
                FileCreationInformation fci = new() {
                    ContentStream = mstream.Value,
                    Url = sourceFile.Name,
                    Overwrite = true,
                };
                targetFolder.Files.Add(fci);
                targetCtx.ExecuteQuery();
            } catch (Exception) {
                logEvent.LogError($"Failed to add file {sourceFile.Name}");
            } finally {
                mstream.Value.Dispose();
            }
        }

        public static void InstallApp(ClientContext ctx, string appName, ILogger log) {
            AppManager appManager = new(ctx);
            var apps = appManager.GetAvailable();
            var templateApp = apps.Find(a => a.Title == appName);
            if (templateApp != null) {
                if (templateApp.InstalledVersion == null) {
                    appManager.Install(templateApp);
                    //log.LogInformation($"Installed {templateApp.Title}");
                } else {
                    if (templateApp.InstalledVersion != templateApp.AppCatalogVersion) {
                        appManager.Upgrade(templateApp);
                        //log.LogInformation($"Upgraded {templateApp.Title}");
                    }
                }
            } else {
                log.LogError($"{appName} app not found");
            }
        }

        public static Dictionary<string, string> GetFieldTypeMapping(List list) {
            list.Context.Load(list, c => c.Fields);
            list.Context.Load(list, c => c.Fields.Include(field => field.TypeAsString));
            list.Context.ExecuteQuery();

            Dictionary<string, string> fieldTypes = [];
            foreach (Field field in list.Fields) {
                fieldTypes.Add(field.InternalName, field.TypeAsString);
            }
            return fieldTypes;
        }

        //public static Dictionary<string, string> GetDocumentFieldMapping(List list) {
        //    List<ListItem> fieldMappingItems = GetAllItems(list);
        //    Dictionary<string, string> fieldMappings = [];
        //    foreach (ListItem item in fieldMappingItems) {
        //        fieldMappings.Add(item.GetFieldValueAs<string>("fileFieldName"), item.GetFieldValueAs<string>("spInternalName"));
        //    }

        //    return fieldMappings;
        //}

        public static void SetLayout(ClientContext ctx, string siteLogoUrl) {
            ctx.Web.HeaderLayout = HeaderLayoutType.Compact;
            ctx.Web.HeaderEmphasis = SPVariantThemeType.Strong;
            ctx.Web.FooterEnabled = false;
            ctx.Web.SiteLogoUrl = siteLogoUrl;

            ctx.Web.Update();
            ctx.ExecuteQuery();
        }

        public static string ToStringFieldValue(ListItem item, string fieldName, string fieldType) {
            switch (fieldType) {
                case "Text":
                    return item.GetFieldValueAs<string>(fieldName);
                case "DateTime":
                    return item.GetFieldValueAs<DateTime?>(fieldName)?.ToString("yyyy-MM-dd", new CultureInfo("da-dk", true)) ?? "";
                case "User":
                    return item.GetFieldValueAs<FieldUserValue>(fieldName)?.LookupValue ?? "";
                case "Lookup":
                    return item.GetFieldValueAs<FieldLookupValue>(fieldName)?.LookupValue ?? "";
                case "Number":
                    return item.GetFieldValueAs<double>(fieldName).ToString();
                case "Boolean":
                    return item.GetFieldValueAs<bool>(fieldName).ToString();
                default:
                    return "Unknown field type";
            }

        }

        public static void EnableFeature(ClientContext ctx, Guid guid) {
            ctx.Site.Features.Add(guid, true, FeatureDefinitionScope.None);
            ctx.ExecuteQuery();
        }
    }
}