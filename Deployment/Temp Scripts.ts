/*
  Hit 'ctrl + d' or 'cmd + d' to run the code, view console for results
*/
import { sp } from "@pnp/sp/presets/all";

(async () => {


  let listFields = await sp.web.lists.getByTitle("Sager").fields();
  listFields = listFields.filter(x => !x.ReadOnlyField && (x as any).CanBeDeleted)

  const fields = listFields.map(x => (
    {
      InternalName: x.InternalName,
      DisplayName: x.Title,
      Type: x.TypeAsString,
      Required: x.Required
    }
  ));
  console.log(fields);
  console.log(JSON.stringify(fields))

})().catch(console.log)





