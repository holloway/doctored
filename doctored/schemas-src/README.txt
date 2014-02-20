Flatten.js processes XML catalogues, and Schemas, resolving all the includes to make a single file.

Usage: 

   node ./flatten.js dita1.8/catalog.xml dita1.8/base/xsd/basemap.xsd > ../schemas/dita1.8/schema.xsd


Trang should be used to flatten schemas. Doctored can only load schemas without imports.