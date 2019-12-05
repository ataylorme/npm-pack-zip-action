# npm-pack-zip-action
Create a `.zip` archive of your npm package. Similar to [npm pack](https://docs.npmjs.com/cli/pack.html), except it will generate a `.zip` archive instead of a tarball. This is useful for making npm package archives for use in AWS Lambda or Azure Web Apps. This project makes use of [`npm-packlist`](https://www.npmjs.com/package/npm-packlist) and [`bestzip`](https://www.npmjs.com/package/bestzip).

## Inputs

- `file-name` (optional): Name of the .zip file to create. `PACKAGE_NAME` will be replaced with the package name from package.json and `SHA` will be replaced with the commit hash that triggered the action.
  - Defaults to `PACKAGE_NAME-SHA.zip`
  - Example: `./sub_dir`
- `source-dir` (optional): The directory, relative to the root, where the package.json to zip is
  - Defaults to the repository root but can be provided to build from a sub-directory 
  - Example: `./sub_dir`

## Outputs

- `zip-path`: The relative path and file name of the `.zip` archive
- `zip-path-full`: The full path and file name of the `.zip` archive