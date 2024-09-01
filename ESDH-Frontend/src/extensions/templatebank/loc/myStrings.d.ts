declare interface ITemplatebankCommandSetStrings {
  advanced: string;
  Command1: string;
  Command2: string;
  create: string;
  createAndOpen: string;
  createSelected: string;
  creationDetailsTitle: string;
  deselectAll: string;
  esdhTitle: string;
  file: string;
  filename: string;
  loadingText: string;
  modified: string;
  newFilename: string;
  preview: string;
  previewFile: string;
  saveLocation: string;
  search: string;
  searchCategory: string;
  selectAll: string;
  selectedCategoryTemplatesTitle: string;
  selectedCategory: string;
  selectedTemplatesTotal: string;
  settings: string;
  simple: string;
  templateCategoriesTitle: string;
  version: string;
}

declare module 'TemplatebankCommandSetStrings' {
  const strings: ITemplatebankCommandSetStrings;
  export = strings;
}
