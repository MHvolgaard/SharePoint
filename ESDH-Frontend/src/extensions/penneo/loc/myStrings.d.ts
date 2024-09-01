declare interface IPenneoCommandSetStrings {
  close: string;
  openpenneo: string;
  addcasefilenamehere: string;
  cancel: string;
  casefilename: string;
  invalidfiles: string;
  invalidfilesdescription: string;
  loading: string;
  sendtopenneo: string;
  successMessage: string;
  validfiles: string;
}

declare module 'PenneoCommandSetStrings' {
  const strings: IPenneoCommandSetStrings;
  export = strings;
}
