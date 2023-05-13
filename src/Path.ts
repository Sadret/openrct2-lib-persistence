/*****************************************************************************
 * Copyright (c) 2020-2022 Sadret
 *
 * The OpenRCT2 plugin library "Persistence" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { FileSystem } from "./FileSystem";

/**
    A wrapper around a file system path to provide convenience methods.
    There is no guarantee that there actually exists a file or folder at the path.
    The generic parameter <T> represents the data format of files.
*/
export class Path<T> {

    /** The file system. */
    private readonly fs: FileSystem<T>;

    /** The path. */
    public readonly path: string;

    /** Construct a new Path on a file system with a given path. */
    public constructor(fs: FileSystem<T>, path: string) {
        this.fs = fs;
        this.path = path;
    }

    /**
        Gets a formatted string representation of the path with given delimiter or "/" by default.
        Note that the folder and file names can contain the delimiter aswell.
    */
    public formatPath(delimiter: string = "/"): string {
        const parent = this.getParent();
        return (parent ? parent.formatPath(delimiter) : "") + this.getName() + (this.isFolder() ? delimiter : "");
    }

    /** Checks if two paths are equal. **/
    public static equals(fst: Path<unknown> | undefined, snd: Path<unknown> | undefined): boolean {
        if (fst === undefined && snd === undefined)
            return true;
        if (fst === undefined || snd === undefined)
            return false;
        return fst.path === snd.path;
    }


    // FILE INFORMATION

    /** Gets the name of this file or folder. */
    public getName(): string { return this.fs.getName(this.path) };

    /** Gets the parent path. Returns undefined if this is the root path. */
    public getParent(): Path<T> | undefined {
        const parent = this.fs.getParent(this.path);
        return parent === undefined ? undefined : new Path(this.fs, parent);
    }

    /** Checks if the file or folder exists. */
    public exists(): boolean { return this.fs.exists(this.path); };

    /** Checks if this path represents a folder. */
    public isFolder(): boolean { return this.fs.isFolder(this.path); };

    /** Checks if this path represents a file. */
    public isFile(): boolean { return this.fs.isFile(this.path); };

    /** Gets contained files if this path represents a folder and [] otherwise. */
    public getFiles(): Path<T>[] {
        return this.fs.getFiles(this.path).map(path => new Path(this.fs, path));
    };

    /** Gets data of file if this path represent a file and undefined otherwise. */
    public getData(): T | undefined { return this.fs.getData(this.path); };


    // FILE & FOLDER CREATION AND DELETION

    /**
        If this path represents a folder, then adds a new folder with a given name to it.
        Returns the path of the new folder, or undefined if the operation failed.
    */
    public addFolder(name: string): Path<T> | undefined {
        const folder = this.fs.getPath(this.path, name);
        return this.fs.createFolder(folder) ? new Path(this.fs, folder) : undefined;
    };

    /**
        If this path represents a folder, then adds a new file with a given name to it.
        Returns the path of the new file, or undefined if the operation failed.
    */
    public addFile(name: string, content: T): Path<T> | undefined {
        const path = this.fs.getPath(this.path, name);
        return this.fs.createFile(path, content) ? new Path(this.fs, path) : undefined;
    };

    /** Deletes the file or folder. */
    public delete(): boolean { return this.fs.delete(this.path); };


    // FILE & FOLDER MODIFICATION

    /**
        Copies the file or folder to a destination given by a parent and a name.
        Returns the path of the new file, or undefined if the operation failed.
    */
    public copy(parent: Path<T>, name: string = this.getName()): Path<T> | undefined {
        const path = this.fs.getPath(parent.path, name);
        return this.fs.copy(this.path, path) ? new Path(this.fs, path) : undefined;
    };

    /**
        Moves the file or folder to a destination given by a parent and a name.
        Returns the path of the new file, or undefined if the operation failed.
    */
    public move(parent: Path<T>, name: string = this.getName()): Path<T> | undefined {
        const path = this.fs.getPath(parent.path, name);
        return this.fs.move(this.path, path) ? new Path(this.fs, path) : undefined;
    };

    /**
        Renames the file or folder.
        Returns the path of the new file, or undefined if the operation failed.
    */
    public rename(name: string): Path<T> | undefined {
        if (this.fs.rename(this.path, name)) {
            const parent = this.getParent();
            if (parent !== undefined) // if this fails, the fs made a mistake
                return new Path(this.fs, this.fs.getPath(parent.path, name));
        }
        return undefined;
    };

    /**
        If this path represents a file, then sets the data of the file.
        Returns if the operation succeeded.
    */
    public setData(content: T): boolean { return this.fs.setData(this.path, content); };
}
