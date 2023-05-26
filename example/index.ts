/*****************************************************************************
 * Copyright (c) 2020-2022 Sadret
 *
 * The OpenRCT2 plugin library "Persistence" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { JsonFileSystem, Path } from "openrct2-lib-persistence";

// Declare arbitrary data type for this example.
type Data = {
    n: number,
    s?: string,
    b: boolean,
};

// Create a FileSystem, in this case a JsonFileSystem which stores the data in
// the plugin.store.json file.
const fs = new JsonFileSystem<Data>("lib-persistence.example");

// Set up a FileSystemWatcher.
const unwatchCallback = fs.watch(path => console.log(`${path} has changed`));

// Do not directly use any other FileSystem methods other than those above.
// From now on, we only use the Path API.

// Usually, there is no need to use the Path constructor directly.
// Instead, get the root of the FileSystem.
const root = Path.getRoot(fs);

// Show information about the root folder.
console.log(
    root.formatPath(), // ''
    root.getName(), // ''
    root.getParent(), // undefined
    root.exists(), // true
    root.isFile(), // false
    root.isFolder(), // true
);

// Add a folder to the root.
const folder = root.addFolder("my_folder");
// Check if folder was created.
if (!folder) throw new Error("Creation of folder failed!");

// Add a subfolder.
const subfolder = folder.addFolder("my_subfolder");
if (!subfolder) throw new Error("Creation of subfolder failed!");

// Add a file.
const file = subfolder.addFile("my_file", { n: 42, s: "foo", b: true });
if (!file) throw new Error("Creation of file failed!");

// Show information about the file.
console.log(
    file.formatPath(), // '/my_folder/my_subfolder/my_file'
    file.getName(), // 'my_file'
    file.getParent(), // {...}
    file.exists(), // true
    file.isFile(), // true
    file.isFolder(), // false
);

// File and folder names can be anything.
subfolder.addFile("!§$%&/()=?`´ ^°+*~#'{[]}\\,;.:-_<>|09", { n: 0, b: false });

// Unwatch the file system.
unwatchCallback();

// Copy a file to another folder.
const copyDestination = root.getChild(file.getName())
const copied = file.copy(copyDestination);
if (!copied) throw new Error("Copying file failed!");

// Move it back to the original folder.
// Fails, since there already exists a file with this name. Returns false.
console.log(copyDestination.move(subfolder.getChild(file.getName())));

// Move it back to the original folder, but change the name.
const moveDestination = subfolder.getChild("new file name");
const moved = copyDestination.move(moveDestination);
if (!moved) throw new Error("Moving file failed!");

// Rename the file.
const renamed = moveDestination.rename("another file name");
if (!renamed) throw new Error("Renaming file failed!");

// Get the data of the file.
const data = file.getData();
if (!data) throw new Error("Something went wrong!");

// Update the data of the file.
file.setData({ n: -1, s: "baz", b: false });

// Get the children of the subfolder.
const children = subfolder.getChildren();
if (!children) throw new Error("Something went wrong!");

// Show information about the children.
// [ 'my_file', '!§$%&/()=?`´ ^°+*~#'{[]}\,;.:-_<>|09', 'another file name' ]
console.log(children.map(path => path.getName()));

// Delete a file.
if (file.delete()) console.log("File successfully deleted.")
else throw new Error("Something went wrong!");

// Delete the root to delete all data of the file system.
root.delete();

// The FileSystem instance and the root may or may not be valid at this point.
console.log(
    root.formatPath(), // ''
    root.getName(), // ''
    root.getParent(), // undefined
    root.exists(), // false <= root may not exist anymore
    root.isFile(), // false
    root.isFolder(), // false <= root may not be a folder anymore
);
