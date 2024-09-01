using Helpers;
using Microsoft.Online.SharePoint.TenantAdministration;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Taxonomy;
using Newtonsoft.Json;
using PnP.Framework;
using System.Reflection;

namespace Deploy {
    internal class Program {

        //private static readonly string tenantName = "netipdemo";
        private static readonly string tenantName = "fjordland";

        static void Main(string[] args) {

            AuthenticationManager auth = AuthenticationManager.CreateWithInteractiveLogin("31359c7f-bd7e-475c-86db-fdb8c937548e"); // PnP Management Shell

            string adminSiteUrl = $"https://{tenantName}-admin.sharepoint.com";
            ClientContext adminCtx = SharePoint.LoadSPContext(auth, adminSiteUrl);
            adminCtx.Load(adminCtx.Web, w => w.Url);
            adminCtx.Load(adminCtx.Web.CurrentUser, u => u.LoginName);
            adminCtx.ExecuteQuery();

            Console.WriteLine($"Connected to SharePoint Online - {adminCtx.Web.Url}");

            string defaultSiteOwner = adminCtx.Web.CurrentUser.LoginName.Replace("i:0#.f|membership|", "");

            string esdhSiteUrl = $"https://{tenantName}.sharepoint.com/sites/ESDH";
            //string esdhAdminSiteUrl = $"https://{tenantName}.sharepoint.com/sites/ESDHAdmin";

            Tenant tenant = new(adminCtx);

            SharePoint.EnsureSite(adminCtx, tenant, esdhSiteUrl, "ESDH", defaultSiteOwner);
            //SharePoint.EnsureSite(adminCtx, tenant, esdhAdminSiteUrl, "ESDH Admin", defaultSiteOwner);

            adminCtx.Dispose();


            ClientContext ctx = SharePoint.LoadSPContext(auth, esdhSiteUrl);
            ctx.Load(ctx.Web, w => w.Url);
            ctx.ExecuteQuery();
            Console.WriteLine($"Connected to SharePoint Online - {ctx.Web.Url}");
            SharePoint.SetRegionalSettings(ctx);

            string customerListSetupPath = Directory.GetCurrentDirectory() + "/Lists/CustomerList.json";
            string caseListSetupPath = Directory.GetCurrentDirectory() + "/Lists/CaseList.json";
            string employeeListSetupPath = Directory.GetCurrentDirectory() + "/Lists/EmployeeList.json";
            string FrontpageSettingsListSetupPath = Directory.GetCurrentDirectory() + "/Lists/FrontpageSettingsList.json";
            string templateListSetupPath = Directory.GetCurrentDirectory() + "/Lists/TemplateList.json";
            string folderTemplateListSetupPath = Directory.GetCurrentDirectory() + "/Lists/FolderTemplateList.json";
            string FieldMappingListSetupPath = Directory.GetCurrentDirectory() + "/Lists/FieldMappingList.json";

            var customerListGuid = EnsureListFromJson(ctx, customerListSetupPath);
            var caseListGuid = EnsureListFromJson(ctx, caseListSetupPath);
            var employeeListGuid = EnsureListFromJson(ctx, employeeListSetupPath);
            var frontpageListGuid = EnsureListFromJson(ctx, FrontpageSettingsListSetupPath);
            var templateLibraryGuid = EnsureListFromJson(ctx, templateListSetupPath);
            var folderTemplateLibraryGuid = EnsureListFromJson(ctx, folderTemplateListSetupPath);
            var fieldMappingListGuid = EnsureListFromJson(ctx, FieldMappingListSetupPath);

            ctx.Dispose();



            //ctx = SharePoint.LoadSPContext(auth, esdhAdminSiteUrl);
            //ctx.Load(ctx.Web, w => w.Url);
            //ctx.ExecuteQuery();
            //Console.WriteLine($"Connected to SharePoint Online - {ctx.Web.Url}");
            //SharePoint.SetRegionalSettings(ctx);

            //ctx.Dispose();


            var values = new Dictionary<string, string>
            {
            { "SPO:AdminSiteUrl", adminSiteUrl },
            //{ "SPO:ESDHAdminSiteUrl", esdhAdminSiteUrl },
            { "SPO:ESDHSiteUrl", esdhSiteUrl },
            { "SPO:DefaultSiteOwner", defaultSiteOwner },
            { "SPO:CustomerListGuid", customerListGuid },
            { "SPO:CaseListGuid", caseListGuid },
            { "SPO:EmployeeListGuid", employeeListGuid },
            //{ "SPO:PermissionListGuid", permissionListGuid },
            //{ "SPO:PermissionUpdateTaskListGuid", permissionUpdateTaskListGuid },
            { "SPO:TemplateLibraryGuid", templateLibraryGuid },
            { "SPO:FolderTemplateLibraryGuid", folderTemplateLibraryGuid },
            { "SPO:FieldMappingListGuid", fieldMappingListGuid },
            { "AAD:TenantId", "TODO" },
            { "AAD:ClientId", "TODO" },
            { "KeyVault:Uri", "TODO" },
            { "KeyVault:CertificateName", "TODO" },
            { "SPO:AdminGroup", "TODO" },
            { "SPO:MemberGroup", "TODO" },
            { "SPO:ThemeName", "TODO" },
            { "SPO:SiteLogoUrl", "TODO" },
            };

            var jsonObject = new Dictionary<string, object>
            {
            { "Values", values }
            };

            string json = JsonConvert.SerializeObject(jsonObject, Formatting.Indented);


            // check if config file exists in this c# project. Update the file if it exists , otherwise create a new file.
            string configPath = Directory.GetCurrentDirectory().Split("\\bin\\")[0] + "\\config.json";
            System.IO.File.WriteAllText(configPath, json);


        }


        private static string EnsureListFromJson(ClientContext ctx, string jsonPath) {
            string json = System.IO.File.ReadAllText(jsonPath);
            JsonListConfig listConfig = JsonConvert.DeserializeObject<JsonListConfig>(json);

            Console.WriteLine($"Ensuring list: {listConfig.ListName}");

            List list;

            //if (ctx.Web.ListExists(new Uri(listConfig.ListUrl, UriKind.Relative))) {
            //    list = ctx.Web.GetListByUrl(listConfig.ListUrl);
            //} else {
            //    list = ctx.Web.Lists.Add(new ListCreationInformation {
            //        Title = listConfig.ListName,
            //        Url = listConfig.ListUrl,
            //        TemplateType = listConfig.Template
            //    });
            //}
            //ctx.Load(list);
            //ctx.Load(list, l => l.Title, l => l.Id);
            //ctx.ExecuteQuery();

            try {
                list = ctx.Web.GetListByUrl(listConfig.ListUrl);
                ctx.Load(list);
                ctx.ExecuteQuery();
                return list.Id.ToString();
            } catch (Exception) {
                list = ctx.Web.Lists.Add(new ListCreationInformation {
                    Title = listConfig.ListName,
                    Url = listConfig.ListUrl,
                    TemplateType = listConfig.Template
                });
                ctx.Load(list);
                ctx.ExecuteQuery();
            }

            SetUICultures(ctx, list, listConfig.UICultures);
            SetSettings(ctx, list, listConfig.Settings);
            SetListFields(ctx, list, listConfig.Fields);
            SetListPermissions(ctx, list, listConfig.Permissions);

            return list.Id.ToString();
        }


        private static void SetUICultures<T>(ClientContext ctx, T spobject, List<JsonListUICulture> uICultures) {
            if (uICultures == null || uICultures.Count == 0) return;
            foreach (JsonListUICulture culture in uICultures) {
                (spobject as dynamic).TitleResource.SetValueForUICulture(culture.Locale, culture.Value);

            }
             (spobject as dynamic).Update();
            ctx.ExecuteQuery();
        }

        //private static void SetUICultures(ClientContext ctx, List spobject, List<JsonListUICulture> uICultures) {
        //    if (uICultures == null || uICultures.Count == 0) return;
        //    foreach (JsonListUICulture culture in uICultures) {
        //        spobject.TitleResource.SetValueForUICulture(culture.Locale, culture.Value);

        //    }
        //    spobject.Update();
        //    ctx.ExecuteQuery();
        //}

        //private static void SetUICultures(ClientContext ctx, Field spobject, List<JsonListUICulture> uICultures) {
        //    if (uICultures == null || uICultures.Count == 0) return;
        //    foreach (JsonListUICulture culture in uICultures) {
        //        spobject.TitleResource.SetValueForUICulture(culture.Locale, culture.Value);

        //    }
        //    spobject.Update();
        //    ctx.ExecuteQuery();
        //}

        private static void SetSettings<T>(ClientContext ctx, T spobject, List<JsonListSetting> settings) {
            if (settings == null || settings.Count == 0) return;

            Type spobjectType = spobject.GetType();
            foreach (JsonListSetting setting in settings) {
                PropertyInfo property = spobjectType.GetProperty(setting.Name);
                if (property != null && property.CanWrite) {
                    object value = Convert.ChangeType(setting.Value, property.PropertyType);
                    property.SetValue(spobject, value);
                } else {
                    Console.WriteLine($"Property {setting.Name} not found or is read-only.");
                }
                //(spobject as dynamic)[setting.Name] = setting.Value;
            }
            (spobject as dynamic).Update();
            ctx.ExecuteQuery();
        }

        private static void SetListFields(ClientContext ctx, List list, List<JsonListField> fieldConfig) {
            ctx.Load(list.Fields);
            ctx.Load(list.DefaultView, v => v.ViewFields);
            ctx.ExecuteQuery();

            foreach (JsonListField jsonField in fieldConfig) {
                list.FieldExistsByName(jsonField.InternalName);

                Field field;

                if (list.FieldExistsByName(jsonField.InternalName)) {
                    field = list.Fields.GetFieldByInternalName(jsonField.InternalName);
                } else {
                    field = list.Fields.AddFieldAsXml($"<Field Name='{jsonField.InternalName}' StaticName='{jsonField.InternalName}' DisplayName='{jsonField.DisplayName}' Type='{jsonField.Type}' />", jsonField.AddToDefaultView, AddFieldOptions.AddFieldInternalNameHint);
                }

                ctx.Load(field);
                ctx.ExecuteQuery();
                ctx.Load(list.DefaultView, v => v.ViewFields);
                ctx.ExecuteQuery();

                if (jsonField.Type == "Lookup") {
                    FieldLookup fieldLookup = ctx.CastTo<FieldLookup>(field);
                    ctx.Load(fieldLookup);
                    ctx.ExecuteQuery();

                    List lookupList = ctx.Web.GetListByTitle(jsonField.LookupListName);
                    ctx.Load(lookupList, l => l.Id);
                    ctx.ExecuteQuery();

                    fieldLookup.LookupList = lookupList.Id.ToString();
                    fieldLookup.LookupField = jsonField.LookupField;
                    fieldLookup.UpdateAndPushChanges(true);
                    ctx.ExecuteQuery();
                }

                if (jsonField.Type == "Choice" || jsonField.Type == "MultiChoice") {
                    FieldChoice fieldChoice = ctx.CastTo<FieldChoice>(field);
                    ctx.Load(fieldChoice);
                    ctx.ExecuteQuery();

                    fieldChoice.Choices = [.. jsonField.Choices];
                    fieldChoice.UpdateAndPushChanges(true);
                    ctx.ExecuteQuery();
                }

                if (jsonField.Type == "TaxonomyFieldType" || jsonField.Type == "TaxonomyFieldTypeMulti") {
                    TaxonomySession session = TaxonomySession.GetTaxonomySession(ctx);
                    TermStore termStore = session.GetDefaultSiteCollectionTermStore();

                    TermSetCollection termSets = termStore.GetTermSetsByName(jsonField.TermSetName, 1033);

                    ctx.Load(termSets, tsc => tsc.Include(ts => ts.Id));
                    ctx.Load(termStore, ts => ts.Id);
                    ctx.ExecuteQuery();

                    Guid termStoreId = termStore.Id;
                    Guid termSetId = termSets.FirstOrDefault().Id;

                    if (termStoreId != Guid.Empty && termSetId != Guid.Empty) {
                        TaxonomyField taxField = ctx.CastTo<TaxonomyField>(field);
                        ctx.Load(taxField);
                        ctx.ExecuteQuery();

                        taxField.SspId = termStoreId;
                        taxField.TermSetId = termSetId;
                        taxField.TargetTemplate = string.Empty;
                        taxField.AnchorId = Guid.Empty;
                        taxField.UpdateAndPushChanges(true);
                        ctx.ExecuteQuery();
                    }

                }

                string viewFieldName = jsonField.InternalName;
                if (viewFieldName == "Title") {
                    viewFieldName = "LinkTitle";
                }
                if (jsonField.AddToDefaultView) {
                    if (!list.DefaultView.ViewFields.Contains(viewFieldName)) {
                        list.DefaultView.ViewFields.Add(viewFieldName);
                        list.DefaultView.Update();
                        list.DefaultView.RefreshLoad();
                        ctx.ExecuteQuery();
                    }
                } else {
                    if (list.DefaultView.ViewFields.Contains(viewFieldName)) {
                        list.DefaultView.ViewFields.Remove(viewFieldName);
                        list.DefaultView.Update();
                        list.DefaultView.RefreshLoad();
                        ctx.ExecuteQuery();
                    }
                }

                SetUICultures(ctx, field, jsonField.UICultures);
                SetSettings(ctx, field, jsonField.Settings);

            }
        }

        private static void SetListPermissions(ClientContext ctx, List list, JsonListPermission permission) {
            if (permission == null) return;

            if (!permission.BreakRoleInheritance) return;

            list.BreakRoleInheritance(permission.CopyRoleAssignments, true);
            ctx.ExecuteQuery();

            foreach (JsonListRole role in permission.Roles) {

                RoleDefinitionBindingCollection roleDefinitionBinding = new(ctx) {
                   ctx.Web.RoleDefinitions.GetByName(role.RoleDefinition)
                };

                User user = ctx.Web.EnsureUser(role.Principal);

                list.RoleAssignments.Add(user, roleDefinitionBinding);
                ctx.ExecuteQuery();
            }

        }

    }



}

