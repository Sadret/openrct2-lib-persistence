# OpenRCT2 Persistence Library

An OpenRCT2 plug-in persistence library.

## Overview

This library provides declarations and implementations for a file system API.

As of now, there is only one file system back-end implemented, which is `JsonFileSystem`. It stores the file system data and file data in the `plugin.store.json` file in your OpenRCT2 installation folder.

It is planned to add more file systems to this project, for example one that connects to a web server or one that operates on the local hard disk.

**Use this library if:** You want to store dynamically generated data in files and folders, for example user-generated data like the templates of the [Scenery Manager](https://github.com/Sadret/openrct2-scenery-manager) plugin.

**Do not use if:** You always have a fixed data structure (folders and files), which does not change dynamically, for example if you want to save and load settings of your plugin. In that case, most of the time it will be easier to just use the `context.sharedStorage` directly.

## Installation

### Node / npm

Add `openrct2-lib-persistence` to your node dependencies.

### Manual Installation

Download the required files from the latest release on GitHub:
- TypeScript type definition file: `openrct2-lib-persistence.d.ts`
- CommonJS: `openrct2-lib-persistence.cjs.js`
- ES5 (plain JavaScript): `openrct2-lib-persistence.es5.js`
- ECMAScript modules: `openrct2-lib-persistence.esm.js`
- Source maps: `openrct2-lib-persistence.XXX.js.map`

## Usage

*The explanation below assumes that the project uses TypeScript and Node, but you can use the files above in any development environment.*

An example can be found [here](https://github.com/Sadret/openrct2-lib-persistence/blob/master/example/index.ts), it can be build with node. Further documentation can be found as JSDocs in the source file, or in the `.d.ts` definition file that can be downloaded from the latest release.

### General Structure

The two components of this library are the `FileSystem` interface with its implementation `JsonFileSystem`, and the `Path` class.

A *file system* provides the foundation to create, modify and delete folders and files.

Both folders and files are uniquely identified by the combination of their *parent folder* and *name*. In a file system they are represented by a string, which is called a *path*. The exact shape of the path depends on the implementation of the file system. In particular, there is no guarantee that the path syntax follows any conventional format, such as `"folder_name/file_name.dat"`. Therefore, paths should not be created manually, but only obtained from and handled by API methods.

The `Path` class is a wrapper around file system paths which provides easier access to the file system API and other convenience methods. After creating a file system, we obtain a path to the root folder. From that time on, in most cases there is no need to use the file system API directly, and we will use the path wrapper instead.

### Getting Started
```ts
import { JsonFileSystem, Path } from "openrct2-lib-persistence";
const fs: FileSystem<T> = new JsonFileSystem<T>("lib-persistence.example");
const root: Path<T> = Path.getRoot(fs);
```
In this example, we create a new JsonFileSystem with a given namespace. Each file system is identified by its namespace, which must be a valid identifier using JS dot notation, e.g. `"my-plugin.data"` or `"my-plugin.data.saves"`, but not just `"my-plugin"`. The namespace is the path in the `plugin.store.json` file under which the filesystem will be saved.

The file system API has a generic type parameter that specifies the type of the content of the files. If you do not want to restrict the data type but instead want to store arbitrary data, you can use e.g. `object` or even `unknown` (which also includes primitives). In this guide, we consider some arbitrary data type `T`.

### Navigating a File System
```ts
const path: Path<T> = ...;

const parent: Path<T> | undefined = path.getParent();
const child: Path<T> = path.getChild("name");
const children: Path<T>[] | undefined = path.getChildren();
```
To get the parent folder of a path, use `getParent`. It returns `undefined` if the path is already the root file.

For getting children, both files and folders, there are two methods. To get a specific child by name, there is `getChild`. Calling this method does *not* create a file or folder at the returned path. The second method is `getChildren` which returns all children of a folder. If the path is not a folder, it returns `undefined` instead.

### Information Retrieval
```ts
const path: Path<T> = ...;

const name: string = path.getName();
const exists: boolean = path.exists();
const isFolder: boolean = path.isFolder();
const isFile: boolean = path.isFile();
const data: T | undefined = path.getData();
```
The method `getData` is used to get the data content of a file. It returns `undefined` if there exists no file at this path. The data object retrieved is only a *copy* of the content! That is, changing the object does not update the file. For that, use `setData`, described below.

### Creation and Deletion
```ts
const path: Path<T> = ...;
const data: T = ...;

const folderCreated: boolean = path.createFolder();
const fileCreated: boolean = path.createFile(data);
const deleted: boolean = path.delete();
const folder: Path<T> | undefined = path.addFolder("name");
const file: Path<T> | undefined = path.addFile("name", data);
```
The methods `createFolder` and `createFile` create a new folder or file at this path. The method `delete` deletes the folder or file at this path. All three methods return if the operation has succeeded. The creation methods can fail if e.g. there is already a file or folder at that path, the deletion method fails if e.g. there is no file or folder at that path.

The methods `addFolder` and `addFile` work similarly as the first two methods, but create a folder or file as a child of the current path. They return the path of the newly created folder or file, or undefined if the operation failed. The latter happens if for example this path is not a folder.

### Modification
```ts
const source: Path<T> = ...;
const destination: Path<T> = ...;
const file: Path<T> = ...;
const data: T = ...;

const copied: boolean = source.copy(destination);
const moved: boolean = source.move(destination);
const renamed: boolean = source.rename("new name");
const updated: boolean = file.setData(data);
```
The first three methods are used to copy, move, and rename folders and files. They can fail if for example the source does not exist or the destination already exists. The last method is to update the contents of a file. It can only succeed if the file system actually contains a file at this path.

### Convenience Methods
```ts
const path1: Path<T> = ...;
const path2: Path<T> = ...;

const equal: boolean = Path.equals(path1, path2);
const formatted: string = path1.format();
```
To check if two paths are equal, i.e. point to the same file or folder on the same file system, use `Path.equal`.

The method `path.format` formats the path to a displayable string. By default, it uses the `"folder/subfolder/.../file"` format, but the delimiter can be changed by an optional parameter.

### File System Watchers
```ts
const fs: FileSystem<T> = ...;

const unwatchCallback: () => void = fs.watch(path => console.log(`${path} has changed`));
// ...
unwatchCallback();
```
Watching a file system means getting notified by any changes made to the folders and files. A change can for example be creating, deleting, renaming or moving a file or folder, or updating the contents of a file.

**Attention:**
- Only changes made via *this* file system instance are guaranteed to be reported! If the data is changed in another way, for example by another plugin or by manually modifying the `plugin.store.json` file, the file system is not required to call the watcher.
- If one operation affects multiple files and folders, for example when a folder is deleted, then the watcher is called only once, with the highest affected path. If a file or folder is moved, then the watcher will be called for both the old path and the new path.

When registering a watcher callback, the file system returns a method that can be called to unregister the watcher.

## Support Me

Subscribe to my YouTube channel to learn about upcoming features:
[Sadret Gaming](https://www.youtube.com/channel/UCLF2DGVDbo_Od5K4MeGNTRQ/)

If you find any bugs or if you have any ideas for improvements, you can open an issue on GitHub or contact me on Discord: Sadret#2502.

If you like this library, please leave a star on GitHub.

If you really want to support me, you can [buy me a coffee](https://www.BuyMeACoffee.com/SadretGaming).

## Copyright and License

Copyright (c) 2023 Sadret\
The OpenRCT2 plug-in library "Persistence" is licensed under the GNU General Public License version 3.
