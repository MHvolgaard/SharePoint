$ErrorActionPreference = "Stop"

$adminSiteUrl = "https://mhipdev-admin.sharepoint.com"
$siteUrl = "https://mhipdev.sharepoint.com/sites/TemplateBank"
$siteTitle = "Template Bank"
$listName = "Template Bank" # Should always be "Template Bank"!
$groupName = "Template Contributor"
$listUrl = $listName.Replace(" ", "")


# connect to admin site
Connect-PnPOnline -Url $adminSiteUrl -Interactive

# create new site
New-PnPSite -Type CommunicationSite -Title $siteTitle -Url $siteUrl -Lcid 1033  # Lcid = default language. 1033 = en-US, 1030 = da-DK
Write-Host "Created sitecollection: $SiteURL" -foregroundcolor Green

# connect to new site
Connect-PnPOnline -Url $siteUrl -Interactive
Write-Host "Connected to site: $siteTitle" -foregroundcolor Green

# create template library (Enable versioning)
New-PnPList -Title $listUrl -Template DocumentLibrary
Set-PnPList -Identity $listUrl -BreakRoleInheritance -CopyRoleAssignments -Title $listName
Write-Host "Created list: $listName" -foregroundcolor Green

# create site homepage
# $page = Get-PnPPage -Identity "Home"
# $sectionsCount = $page.Sections.Count
# for ($i = $sectionsCount - 1; $i -ge 0; $i--) {
#     write-host $i
#     $page.Sections.RemoveAt($i)
# }
# $dl = Get-PnPList -Identity $listName
# Add-PnPPageSection -Page $page -SectionTemplate OneColumn -Order 1
# Add-PnPPageWebPart -Page $page -DefaultWebPartType List -Section 1 -Column 1 -WebPartProperties @{isDocumentLibrary="true"; selectedListId=$dl.Id}
# Set-PnPPage -Identity $page -Publish
# Write-Host "Site homepage created" -foregroundcolor Green

# Add file metadata to template library
$defaultView = Get-PnPView -Identity "All Documents" -List $listName
$defaultView.ViewFields.RemoveAll()
$defaultView.ViewFields.Add("Type")
$defaultView.ViewFields.Add("Name")

$activeField = Add-PnPField -List $listName -DisplayName "Active" -InternalName "Active" -Type Boolean -AddToDefaultView 
$activeField.Description = "Defines if the field will be shown in the TemplateBank"
Set-PnPDefaultColumnValues -List $ListName -Field "Active" -Value true

$categoryField = Add-PnPField -List $listName -DisplayName "Category" -InternalName "Category" -Type MultiChoice -AddToDefaultView
$categoryField.Description = "Choose one or more categories for the file"

$guidanceField = Add-PnPField -List $listName -DisplayName "Guidance" -InternalName "Guidance" -Type Note -AddToDefaultView
$guidanceField.Description = "Guide others on how to use the file"

$defaultView.ViewFields.Add("Modified")
$defaultView.ViewFields.Add("Editor")

Set-PnPField -List $listName -Identity "Title" -Values @{Hidden = $True }

$defaultView.Update()
Invoke-PnPQuery

Write-Host "Added metadata fields to list" -foregroundcolor Green

# add "Everyone except external users" with READ permissions
$loginName = "everyone except external users"
$group = Get-PnPGroup -AssociatedVisitorGroup;
Add-PnPGroupMember -Identity $group -LoginName $loginName
Write-Host "Permission added: $loginName" -foregroundcolor Green

# create a new sharepoint permission group named "Template Contributor"
New-PnPGroup -Title $groupName
Write-Host "Created group: $groupName" -foregroundcolor Green

# give new group "CONTRIBUTE" permissions to template library
Set-PnPListPermission -Identity $listName -AddRole "CONTRIBUTE" -Group $groupName
Set-PnPGroupPermissions -Identity $groupName -AddRole "Read"
Write-Host "List and group permissions added" -foregroundcolor Green

Write-Host "Script complete." -foregroundcolor Green