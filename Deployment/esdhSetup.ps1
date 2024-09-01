$ErrorActionPreference = "Stop"

# $tenantName = "netipdemo"
$tenantName = "netipdemo"

# ------------------------------------------------------------------------------------------------------------------------------------------------------------
# Functions
Function Add-site() {
    Param(
        [Parameter(Mandatory = $True)]
        [String]$SiteAlias,
        [Parameter(Mandatory = $True)]
        [String]$SiteName
    )
    $newSiteUrl = "https://" + $tenantName + ".sharepoint.com/sites/" + $SiteAlias

    $Site = Get-PnPTenantSite | Where-Object { $_.Url -eq $newSiteUrl }
    if ($null -eq $Site) {
        New-PnPSite -Type CommunicationSite -Title $SiteName -Url $newSiteUrl -Lcid 1033  # Lcid = default language. 1033 = en-US, 1030 = da-DK
        Write-host "Site $($newSiteUrl) created!" -foregroundcolor Green
    }
    else {
        Write-host "Site $($newSiteUrl) exists already!"
    }
    return $newSiteUrl
}

Function Set-RegionalSettings() {
    $web = Get-PnPWeb -Includes RegionalSettings, RegionalSettings.TimeZones
         
    $web.RegionalSettings.LocaleId = 1030
    $web.RegionalSettings.TimeZone = $web.RegionalSettings.TimeZones | Where-Object { $_.Id -eq 3 } # (GMT+01:00) Brussels, Copenhagen, Madrid, Paris
    $web.RegionalSettings.Time24 = $True
    $web.RegionalSettings.WorkDayStartHour = 8
    $web.RegionalSettings.WorkDayEndHour = 16
    $web.RegionalSettings.WorkDays = 62 # Monday - Friday
    $web.RegionalSettings.CalendarType = 1 # Gregorian
    $web.RegionalSettings.FirstDayOfWeek = 1 # Monday
    $web.RegionalSettings.FirstWeekOfYear = 2 # First 4-day week
    $web.RegionalSettings.ShowWeeks = $True
    $web.RegionalSettings.Collation = 9 # Sort order: Danish/Norwegian

    $web.Update()
    Invoke-PnPQuery
}
        
Function Add-ListFromJson() {
    Param(
        [Parameter(Mandatory = $True)]
        [String]$JsonFilePath
    )
    $listSetup = Get-Content $JsonFilePath -Encoding UTF8 | ConvertFrom-Json
    Write-Host "Adding list: " $listSetup.ListName
          
    $newList = Get-PnPList -Identity $listSetup.ListUrl
    if ($Null -eq $newList) {
        $newList = New-PnPList -Url $listSetup.ListUrl -Title $listSetup.ListName -Template $listSetup.template
    }
    Set-UICultures -SpItem $newList -UICultures $listSetup.UICultures
    Set-Settings -SpItem $newList -Settings $listSetup.Settings
    Set-ListFields -List $newList -Fields $listSetup.Fields
    Set-ListPermissions -ListName $listSetup.ListName -Permissions $listSetup.Permissions

    return $newList.Id
}

Function Set-UICultures() {
    Param(
        [Parameter(Mandatory = $True)]
        [Object]$SpItem,
        [Object[]]$UICultures
    )
    if ($null -eq $UICultures) {
        return
    }
    if ($UICultures.Count -eq 0) {
        return
    }

    for ($i = 0; $i -lt $UICultures.Count; $i++) {
        $SpItem.TitleResource.SetValueForUICulture($UICultures[$i].Locale, $UICultures[$i].Value)
    }
    $SpItem.Update()
    Invoke-PnPQuery 
}

Function Set-Settings() {
    Param(
        [Parameter(Mandatory = $True)]
        [Object]$SpItem,
        [Object[]]$Settings
    )
    if ($null -eq $Settings) {
        return
    }
    if ($Settings.Count -eq 0) {
        return
    }
    for ($i = 0; $i -lt $Settings.Count; $i++) {
        $SpItem.($Settings[$i].Name) = $Settings[$i].Value
    }
    $SpItem.Update()
    Invoke-PnPQuery 
}

Function Set-ListFields() {
    Param(
        [Parameter(Mandatory = $True)]
        [Object]$List,
        [array]$Fields
    )
    if ($null -eq $Fields) {
        return
    }
    $ctx = Get-PnPContext
    $ctx.Load($List.DefaultView.ViewFields)
    Invoke-PnPQuery
    for ($i = 0; $i -lt $Fields.Count; $i++) {          
        $field = Get-PnPField -List $List -Identity $Fields[$i].InternalName -ErrorAction SilentlyContinue
        If ($Null -eq $Field) {
            $field = Add-PnPField -List $List -InternalName $Fields[$i].InternalName -DisplayName $Fields[$i].DisplayName -Type $Fields[$i].Type
        }
        if ($Fields[$i].Type -eq "Lookup") {
            Set-PnPField -List $List -Identity  $Fields[$i].InternalName -Values @{LookupList = (Get-PnPList $Fields[$i].LookupListName).Id.ToString(); LookupField = $Fields[$i].LookupField } | Out-Null
        }
        if ($Fields[$i].Type -eq "Choice" -or $Fields[$i].Type -eq "MultiChoice") {
            $choiceField = New-Object Microsoft.SharePoint.Client.FieldChoice($ctx, $field.Path)
            $ctx.Load($choiceField)
            Invoke-PnPQuery
            $choiceField.Choices = $Fields[$i].Choices
            $choiceField.UpdateAndPushChanges($True)
            Invoke-PnPQuery
        }
        $viewFieldName = $Fields[$i].InternalName;
        if ($viewFieldName -eq "Title") {
            $viewFieldName = "LinkTitle"
        }
        if ($Fields[$i].AddToDefaultView -eq $false) {
            if ($List.DefaultView.ViewFields -contains $viewFieldName) {
                $List.DefaultView.ViewFields.Remove($viewFieldName)
                $List.DefaultView.Update()
                Invoke-PnPQuery
            }
        }
        else {
            if ($List.DefaultView.ViewFields -notcontains $viewFieldName) {
                $List.DefaultView.ViewFields.Add($viewFieldName)
                $List.DefaultView.Update()
                Invoke-PnPQuery
            }
        }
        Set-UICultures -SpItem $field -UICultures $Fields[$i].UICultures
        Set-Settings -SpItem $field -Settings $Fields[$i].Settings
    }
}

Function Set-ListPermissions() {
    Param(
        [Parameter(Mandatory = $True)]
        [string]$ListName,
        [array]$Permissions
    )
    if ($null -eq $Permissions) {
        return
    }
    Set-PnPList -Identity $Listname -BreakRoleInheritance:$Permissions.BreakRoleInheritance -CopyRoleAssignments:$Permissions.CopyRoleAssignments
    if ($Permissions.BreakRoleInheritance -eq $false) {
        return
    }
    if ($null -eq $Permissions.Roles) {
        return
    }
    for ($i = 0; $i -lt $Permissions.Roles.Count; $i++) {
        Set-PnPListPermission -Identity $ListName -AddRole $Permissions.Roles[$i].RoleDefinition -User $Permissions.Roles[$i].Principal | Out-Null
    }
}

# ------------------------------------------------------------------------------------------------------------------------------------------------------------

# Create ESDH sites
$adminSiteUrl = "https://" + $tenantName + "-admin.sharepoint.com"
Connect-PnPOnline -Url $adminSiteUrl -Interactive

$ctx = Get-PnPContext
$ctx.Load($ctx.Web.CurrentUser)
Invoke-PnPQuery
$defaultSiteOwner = $ctx.Web.CurrentUser.LoginName
            
$esdhSiteUrl = Add-site -SiteAlias "ESDH" -SiteName "ESDH"
$esdhAdminSiteUrl = Add-site -SiteAlias "ESDHAdmin" -SiteName "ESDH Admin"

            
# Setup ESDH site
Connect-PnPOnline -Url $esdhSiteUrl -Interactive
Set-RegionalSettings
$customerListSetupPath = $PSScriptRoot + "\CustomerSetup.json"
$customerListGuid = Add-ListFromJson -JsonFilePath $customerListSetupPath
$caseListSetupPath = $PSScriptRoot + "\CaseSetup.json"
$caseListGuid = Add-ListFromJson -JsonFilePath $caseListSetupPath
$frontpageSettingsListSetupPath = $PSScriptRoot + "\FrontpageSettingsSetup.json"
Add-ListFromJson -JsonFilePath $frontpageSettingsListSetupPath
            
            
# Set ESDH admin site
Connect-PnPOnline -Url $esdhAdminSiteUrl -Interactive
Set-RegionalSettings
$employeeListSetupPath = $PSScriptRoot + "\EmployeeSetup.json"
$employeeListGuid = Add-ListFromJson -JsonFilePath $employeeListSetupPath
# $permissionListSetupPath = $PSScriptRoot + "\PermissionSetup.json"
# $permissionListGuid = Add-ListFromJson -JsonFilePath $permissionListSetupPath
# $permissionUpdateTaskListSetupPath = $PSScriptRoot + "\PermissionUpdateTaskSetup.json"
# $permissionUpdateTaskListGuid = Add-ListFromJson -JsonFilePath $permissionUpdateTaskListSetupPath
$templateLibrarySetupPath = $PSScriptRoot + "\TemplateSetup.json"
$templateLibraryGuid = Add-ListFromJson -JsonFilePath $templateLibrarySetupPath
$folderTemplateLibrarySetupPath = $PSScriptRoot + "\FolderTemplateSetup.json"
$folderTemplateLibraryGuid = Add-ListFromJson -JsonFilePath $folderTemplateLibrarySetupPath

$json = @"
"Values": {
    "SPO:AdminSiteUrl": "$esdhAdminSiteUrl",
    "SPO:ESDHAdminSiteUrl": "$esdhAdminSiteUrl",
    "SPO:ESDHSiteUrl": "$esdhSiteUrl",
    "SPO:DefaultSiteOwner": "$defaultSiteOwner",
    "SPO:AdminGroup": "TODO",
    "SPO:CustomerListGuid": "$customerListGuid",
    "SPO:CaseListGuid": "$caseListGuid",
    "SPO:EmployeeListGuid": "$employeeListGuid",
    "SPO:PermissionListGuid": "$permissionListGuid",
    "SPO:PermissionUpdateTaskListGuid": "$permissionUpdateTaskListGuid",
    "SPO:TemplateLibraryGuid": "$templateLibraryGuid",
    "SPO:FolderTemplateLibraryGuid": "$folderTemplateLibraryGuid",
    "SPO:FieldMappingListGuid": "$fieldMappingListGuid",

    "AAD:TenantId": "TODO",
    "AAD:ClientId": "TODO",
    "KeyVault:Uri": "TODO",
    "KeyVault:CertificateName": "TODO"
}
"@

$jsonConfigPath = $PSScriptRoot + "\config.txt"
if(Test-Path $jsonConfigPath) {
    Remove-Item $jsonConfigPath
}
$json | Out-File $jsonConfigPath

Write-Output "Done"
















# $customerEventReceiverUrl = "https://webhook.site/c682895b-8b6d-442e-9f99-8481f13c5de8"
# $caseEventReceiverUrl = "https://webhook.site/c682895b-8b6d-442e-9f99-8481f13c5de8"

# Does not work with the current version of PnP PowerShell - ReceiverAssembly and ReceiverClass are empty when created through PnP PowerShell
# $eventReceiver = Get-PnPEventReceiver -List $customerListName -Identity "ESDH - ItemAdded" -ErrorAction SilentlyContinue
# if ($null -ne $eventReceiver) {
#     Remove-PnPEventReceiver -Identity "ESDH - ItemAdded" -List $customerListName -ErrorAction SilentlyContinue -Force
#     $eventReceiver = $null
# }
# $eventReceiver = Get-PnPEventReceiver -List $customerListName -Identity "ESDH - ItemUpdated" -ErrorAction SilentlyContinue
# if ($null -ne $eventReceiver) {
#     Remove-PnPEventReceiver -Identity "ESDH - ItemUpdated" -List $customerListName -ErrorAction SilentlyContinue -Force
#     $eventReceiver = $null
# }

# Add-PnPEventReceiver -List $customerListName -Name "ESDH - ItemAdded" -Url $customerEventReceiverUrl -EventReceiverType ItemAdded -Synchronization Asynchronous -SequenceNumber 10000
# Add-PnPEventReceiver -List $customerListName -Name "ESDH - ItemUpdated" -Url $customerEventReceiverUrl -EventReceiverType ItemUpdated -Synchronization Asynchronous -SequenceNumber 10000
# Write-Output "Added event receivers to list: $customerListName"


# Does not work with the current version of PnP PowerShell - ReceiverAssembly and ReceiverClass are empty when created through PnP PowerShell
# $eventReceiver = Get-PnPEventReceiver -List $caseListName -Identity "ESDH - ItemAdded" -ErrorAction SilentlyContinue
# if ($null -ne $eventReceiver) {
#     Remove-PnPEventReceiver -Identity "ESDH - ItemAdded" -List $caseListName -ErrorAction SilentlyContinue -Force
#     $eventReceiver = $null
# }
# $eventReceiver = Get-PnPEventReceiver -List $caseListName -Identity "ESDH - ItemUpdated" -ErrorAction SilentlyContinue
# if ($null -ne $eventReceiver) {
#     Remove-PnPEventReceiver -Identity "ESDH - ItemUpdated" -List $caseListName -ErrorAction SilentlyContinue -Force
#     $eventReceiver = $null
# }

# Add-PnPEventReceiver -List $caseListName -Name "ESDH - ItemAdded" -Url $caseEventReceiverUrl -EventReceiverType ItemAdded -Synchronization Asynchronous -SequenceNumber 10000
# Add-PnPEventReceiver -List $caseListName -Name "ESDH - ItemUpdated" -Url $caseEventReceiverUrl -EventReceiverType ItemUpdated -Synchronization Asynchronous -SequenceNumber 10000
# Write-Output "Added event receivers to list: $caseListName"