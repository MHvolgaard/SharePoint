using System.Security.Cryptography.X509Certificates;
using Azure.Storage.Queues.Models;
using Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Online.SharePoint.TenantAdministration;
using Microsoft.SharePoint.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PnP.Core.Model.SharePoint;
using PnP.Framework;
using RoleType = Microsoft.SharePoint.Client.RoleType;

#pragma warning disable CA2254 // Template should be a static expression
namespace ESDH_Backend {
    public class Queue_CustomerHandler {
        private readonly ILogger<Queue_CustomerHandler> _logger;
        private readonly IConfiguration _config;
        private readonly string UrlPrefix = "ESDHCustomer_";

        public Queue_CustomerHandler(ILogger<Queue_CustomerHandler> logger, IConfiguration config) {
            _logger = logger;
            _config = config;
        }

        [Function(nameof(Queue_CustomerHandler))]
        public void Run([QueueTrigger("esdhcustomer-queue")] QueueMessage message) {
            //QueueItem queueItem = JsonConvert.DeserializeObject<QueueItem>(message.MessageText);
            //queueItem.Validate();

            int itemID = Convert.ToInt32(message.MessageText);
            if (itemID == 0) {
                throw new Exception("ItemID is required.");
            }

            FunctionConfiguration config = new(_config);

            //----------------------------------------------

            _logger.LogInformation("Loading certificate from Key Vault...");
            X509Certificate2 cert = AzureHelper.GetKeyVaultCertificate(config.KeyVaultUri, config.KeyVaultCertificateName);
            AuthenticationManager auth = new(config.ClientId, cert, config.TenantId);

            _logger.LogInformation("Certificate loaded from Key Vault");
            ClientContext esdhCtx = SharePoint.LoadSPContext(auth, config.EsdhSiteUrl);

            esdhCtx.Load(esdhCtx.Web, w => w.Url);
            esdhCtx.ExecuteQuery();
            _logger.LogInformation($"Loaded web: {esdhCtx.Web.Url}");

            List spList = esdhCtx.Web.Lists.GetById(config.CustomerListGuid);
            esdhCtx.Load(spList);
            esdhCtx.ExecuteQuery();

            ListItem spItem = spList.GetItemById(itemID);
            esdhCtx.Load(spItem);
            esdhCtx.ExecuteQuery();

            CreateCustomerSite(auth, esdhCtx, spItem, config);


            esdhCtx.Dispose();
        }

        private void CreateCustomerSite(AuthenticationManager auth, ClientContext esdhCtx, ListItem item, FunctionConfiguration config) {
            item["esdhSiteStatus"] = "Processing";
            item.Update();
            esdhCtx.Load(item);
            esdhCtx.ExecuteQuery();

            string adminUrl = AuthenticationManager.GetTenantAdministrationUri(config.EsdhSiteUrl).ToString();
            ClientContext adminCtx = SharePoint.LoadSPContext(auth, adminUrl);
            var tenant = new Tenant(adminCtx);

            Uri uri = new(config.EsdhSiteUrl);
            string rootUrl = $"{uri.Scheme}://{uri.Host}";
            string newSiteUrl = $"{rootUrl}/sites/{UrlPrefix}{item.Id}";

            _logger.LogInformation($"Ensuring site: {newSiteUrl}");
            SharePoint.EnsureSite(adminCtx, tenant, newSiteUrl, item.GetFieldValueAs<string>("esdhName"), config.DefaultSiteOwner, _logger);

            _logger.LogInformation($"Connecting site to hubsite: ");
            SharePoint.ConnectToHubSite(adminCtx, tenant, newSiteUrl, config.HubSiteUrl, _logger);

            //_logger.LogInformation($"Setting site theme");
            //SharePoint.SetSiteTheme(adminCtx, tenant, newSiteUrl, themeName, _logger);

            //List<string> permissionMembers = SharePoint.GetPermissionMembers(esdhAdminCtx, _config["SPO:PermissionListGuid"], item.GetFieldValueAs<string>("esdhNumber"));
            adminCtx.Dispose();

            ClientContext ctx = SharePoint.LoadSPContext(auth, newSiteUrl);
            ctx.Load(ctx.Web, w => w.Url);
            ctx.ExecuteQuery();
            _logger.LogInformation($"Loaded web: {ctx.Web.Url}");

            _logger.LogInformation($"Activating features");
            SharePoint.EnableFeature(ctx, new Guid("8a4b8de2-6fd8-41e9-923c-c7c3c00f8295")); // Open Documents in Client Applications by Default

            //SharePoint.SetSitePermissions(esdhCtx, ctx, _config, item, permissionMembers);
            _logger.LogInformation($"Setting permissions");
            SharePoint.SetSitePermissions(esdhCtx, ctx, config.AdminGroup, config.MemberGroup);

            _logger.LogInformation($"Setting site properties");
            SharePoint.SetSiteProperties(ctx, config.EsdhSiteUrl, config.CustomerListGuid, item.Id, config.TemplateLibraryGuid, "Customer");

            _logger.LogInformation($"Setting regional settings");
            SharePoint.SetRegionalSettings(ctx);

            _logger.LogInformation($"Setting layout");
            SharePoint.SetLayout(ctx, config.SiteLogoUrl);

            _logger.LogInformation($"Installing template bank");
            SharePoint.InstallApp(ctx, "NetIP-ESDH-UI", _logger);

            _logger.LogInformation($"Copying folder template");
            List documentsList = SetDocumentsLibrary(ctx);

            string templateFolderName = "Customer";
            (string sourceRootFolderUrl, List<ListItem> source) = SharePoint.GetAllFromPath(esdhCtx, config.FolderTemplateLibraryGuid, templateFolderName);
            (string targetRootFolderUrl, List<ListItem> target) = SharePoint.GetAllFromPath(ctx, documentsList.Id);
            string sourceRootFolder = sourceRootFolderUrl + "/" + templateFolderName;

            SharePoint.CopyFromSource(esdhCtx, ctx, source, target, sourceRootFolder, documentsList.RootFolder.ServerRelativeUrl, config.AdminGroup, config.MemberGroup, _logger);

            _logger.LogInformation($"Creating 'Notes' list");
            List notesList = CreateNotesList(ctx, config.AdminGroup, config.MemberGroup);

            _logger.LogInformation($"Setting navigation");
            SetNavigation(ctx, esdhCtx.Web.Url, documentsList.RootFolder.ServerRelativeUrl, notesList.RootFolder.ServerRelativeUrl);

            _logger.LogInformation($"Setting homepage");
            SetHomepage(ctx, item, documentsList, notesList);


            esdhCtx.Load(item);
            esdhCtx.ExecuteQuery();
            item["esdhSiteStatus"] = "Completed";
            item["wpSite"] = ctx.Web.Url;
            item.Update();
            esdhCtx.ExecuteQuery();

            ctx.Dispose();
        }

        private static List SetDocumentsLibrary(ClientContext ctx) {
            List documentsList = ctx.Web.Lists.GetByTitle("Documents");
            ctx.Load(documentsList, p => p.RootFolder.ServerRelativeUrl, p => p.Id, p => p.Title, p => p.Fields);
            documentsList.DefaultView.CustomFormatter = Helpers.Constants.listViewFormatJson;
            documentsList.DefaultView.Update();
            ctx.ExecuteQuery();

            if (!documentsList.FieldExistsByName("esdhPenneoStatus")) {
                Field field = documentsList.Fields.AddFieldAsXml($"<Field Name='esdhPenneoStatus' StaticName='esdhPenneoStatus' DisplayName='Penneo Status' Type='Text' />", true, AddFieldOptions.AddFieldInternalNameHint);
                ctx.Load(field);
                ctx.ExecuteQuery();

                field.Hidden = true;
                field.Update();
                ctx.ExecuteQuery();
            }


            return documentsList;
        }

        private static List CreateNotesList(ClientContext ctx, string adminGroupName, string memberGroupName) {
            string listName = "Notes";

            List list = null;

            if (ctx.Web.ListExists(listName)) {
                list = ctx.Web.GetListByTitle(listName);
            } else {
                list = ctx.Web.CreateList(Microsoft.SharePoint.Client.ListTemplateType.GenericList, listName, true);
            }
            var fields = list.Fields;
            ctx.Load(list);
            ctx.Load(list, l => l.RootFolder.ServerRelativeUrl, l => l.Id, l => l.Title);
            ctx.Load(fields);
            ctx.ExecuteQuery();

            list.ReadSecurity = 1; // Users can read all items
            list.WriteSecurity = 2; // Users can create and edit items created by themselves
            list.EnableAttachments = false;
            list.Update();
            ctx.ExecuteQuery();

            list.ResetRoleInheritance();
            ctx.ExecuteQuery();

            list.BreakRoleInheritance(false, true);
            RoleDefinitionBindingCollection editRDBC = new(ctx) {
                    ctx.Web.RoleDefinitions.GetByType(RoleType.Editor)
                };
            RoleDefinitionBindingCollection fullControlRDBC = new(ctx) {
                    ctx.Web.RoleDefinitions.GetByType(RoleType.Administrator)
                };
            list.RoleAssignments.Add(ctx.Web.EnsureUser(adminGroupName), editRDBC);
            list.RoleAssignments.Add(ctx.Web.EnsureUser(memberGroupName), fullControlRDBC);
            list.Update();
            ctx.ExecuteQuery();


            var titleField = fields.GetByInternalNameOrTitle("Title");
            titleField.Required = true;
            titleField.Update();
            ctx.ExecuteQuery();

            string esdhCategoryInternalName = "esdhCategory";
            if (!fields.Any(f => f.InternalName == esdhCategoryInternalName)) {
                var newField = list.Fields.AddFieldAsXml($"<Field Name='{esdhCategoryInternalName}' StaticName='{esdhCategoryInternalName}' DisplayName='Category' Type='Choice' />", true, AddFieldOptions.AddFieldInternalNameHint);
                newField.Required = true;
                newField.TitleResource.SetValueForUICulture("da-dk", "Kategori");
                newField.Update();
                ctx.Load(fields);
                ctx.ExecuteQuery();

                List<string> choices = ["Kategori 1", "Kategori 2"];
                var choiceField = ctx.CastTo<FieldChoice>(newField);
                choiceField.Choices = [.. choices];
                choiceField.Update();
                ctx.ExecuteQuery();
            }

            string esdhNoteInternalName = "esdhNote";
            if (!fields.Any(f => f.InternalName == esdhNoteInternalName)) {
                var newField = list.Fields.AddFieldAsXml($"<Field Name='{esdhNoteInternalName}' StaticName='{esdhNoteInternalName}' DisplayName='Note' Type='Note' />", true, AddFieldOptions.AddFieldInternalNameHint);
                newField.Required = true;
                newField.TitleResource.SetValueForUICulture("da-dk", "Note");
                newField.CustomFormatter = Helpers.Constants.multilineFieldFormatJson;
                newField.Update();
                ctx.Load(fields);
                ctx.ExecuteQuery();
            }

            var view = list.DefaultView;
            ctx.Load(view);
            ctx.Load(view, v => v.ViewFields);
            ctx.ExecuteQuery();

            if (!view.ViewFields.Contains("Created")) {
                view.ViewFields.Add("Created");
            }
            if (!view.ViewFields.Contains("Author")) {
                view.ViewFields.Add("Author");
            }

            // set sorting of view to newest first
            view.ViewQuery = "<OrderBy><FieldRef Name='Created' Ascending='FALSE' /></OrderBy>";
            view.CustomFormatter = Helpers.Constants.listViewFormatJson;

            view.Update();
            list.RefreshLoad();
            ctx.ExecuteQuery();

            return list;
        }

        private static void SetNavigation(ClientContext ctx, string esdhHomeUrl, string documentListUrl, string notesListUrl) {
            var quickLaunch = ctx.Web.Navigation.QuickLaunch;
            ctx.Load(quickLaunch);
            ctx.ExecuteQuery();

            for (int i = quickLaunch.Count - 1; i >= 0; i--) {
                quickLaunch[i].DeleteObject();
                ctx.ExecuteQuery();
            }
            quickLaunch.RefreshLoad();
            ctx.ExecuteQuery();

            quickLaunch.Add(new NavigationNodeCreationInformation {
                Title = "ESDH",
                Url = esdhHomeUrl,
                IsExternal = false,
                AsLastNode = true,

            });
            ctx.ExecuteQuery();

            var homeNode = quickLaunch.Add(new NavigationNodeCreationInformation {
                Title = "Home",
                Url = ctx.Web.Url,
                IsExternal = false,
                AsLastNode = true,
            });
            homeNode.TitleResource.SetValueForUICulture("da-dk", "Hjem");
            homeNode.Update();
            ctx.ExecuteQuery();

            var documentsNode = quickLaunch.Add(new NavigationNodeCreationInformation {
                Title = "Documents",
                Url = documentListUrl,
                IsExternal = false,
                AsLastNode = true,
            });
            documentsNode.TitleResource.SetValueForUICulture("da-dk", "Dokumenter");
            documentsNode.Update();
            ctx.ExecuteQuery();

            var notesNode = quickLaunch.Add(new NavigationNodeCreationInformation {
                Title = "Notes",
                Url = notesListUrl,
                IsExternal = false,
                AsLastNode = true,
            });
            notesNode.TitleResource.SetValueForUICulture("da-dk", "Noter");
            notesNode.Update();
            ctx.ExecuteQuery();
        }

        private static void SetHomepage(ClientContext ctx, ListItem item, List documentsList, List notesList) {
            string bingMapProps = null;

            // Get coordinates from OpenStreetMap API
            string address = item.GetFieldValueAs<string>("esdhAddress2");
            address += ", " + item.GetFieldValueAs<string>("esdhPostalCode");
            address += " " + item.GetFieldValueAs<string>("esdhCity");
            address += ", Danmark";
            HttpClient client = new();
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (compatible; AcmeInc/1.0)"); // Set a user agent to avoid 403 Forbidden - https://operations.osmfoundation.org/policies/nominatim/
            var response = client.GetAsync($"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1&addressdetails=1").Result;
            if (response.IsSuccessStatusCode) {
                var content = response.Content.ReadAsStringAsync().Result;
                var openSteetMap = JsonConvert.DeserializeObject<List<OpenSteetMap>>(content);
                if (openSteetMap.Count > 0) {
                    var map = openSteetMap[0];
                    bingMapProps = Helpers.Constants.bingMapJsonProps;
                    bingMapProps = bingMapProps.Replace("#latitude#", map.lat);
                    bingMapProps = bingMapProps.Replace("#longitude#", map.lon);
                    bingMapProps = bingMapProps.Replace("#title#", item.GetFieldValueAs<string>("esdhName"));
                    bingMapProps = bingMapProps.Replace("#address#", address);
                }
            }
            client.Dispose();


            var homepage = ctx.Web.LoadClientSidePage("Home.aspx");
            homepage.ClearPage();
            homepage.AddSection(CanvasSectionTemplate.OneColumnVerticalSection, 2, 0, 2);

            var availableWebParts = homepage.AvailablePageComponents();
            var detailsComponent = availableWebParts.FirstOrDefault(p => p.Name == "ESDH-Item Details");
            var advisorsComponent = availableWebParts.FirstOrDefault(p => p.Name == "ESDH-Advisors");
            var bingMapComponent = availableWebParts.FirstOrDefault(p => p.Name == "e377ea37-9047-43b9-8cdb-a761be2f8e09"); // Bing Maps
            var listComponent = availableWebParts.FirstOrDefault(p => p.Name == "f92bf067-bc19-489e-a556-7fe95f508720"); // List

            var advisorsWebpart = homepage.NewWebPart(advisorsComponent);
            homepage.AddControl(advisorsWebpart, homepage.Sections[0].Columns[1], 1);

            var detailsWebpart = homepage.NewWebPart(detailsComponent);
            JValue detailsProps = (JValue)detailsWebpart.PropertiesJson;
            detailsWebpart.PropertiesJson = Helpers.Constants.detailsJsonProps;
            homepage.AddControl(detailsWebpart, homepage.Sections[0].Columns[1], 2);

            var bingMapWebpart = homepage.NewWebPart(bingMapComponent);
            bingMapWebpart.PropertiesJson = bingMapProps;
            homepage.AddControl(bingMapWebpart, homepage.Sections[0].Columns[1], 3);

            var documentsWebpart = homepage.NewWebPart(listComponent);
            documentsWebpart.PropertiesJson = Helpers.Constants.listJsonProps.Replace("#listGuid#", documentsList.Id.ToString()).Replace("#isLibrary#", "true").Replace("#listTitle#", documentsList.Title);
            homepage.AddControl(documentsWebpart, homepage.Sections[0].Columns[0], 1);

            var notesWebpart = homepage.NewWebPart(listComponent);
            notesWebpart.PropertiesJson = Helpers.Constants.listJsonProps.Replace("#listGuid#", notesList.Id.ToString()).Replace("#isLibrary#", "false").Replace("#listTitle#", notesList.Title);
            homepage.AddControl(notesWebpart, homepage.Sections[0].Columns[0], 2);

            homepage.Save();
            homepage.Publish();
        }
    }
}
#pragma warning restore CA2254 // Template should be a static expression