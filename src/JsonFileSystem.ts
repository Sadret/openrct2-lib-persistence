/*****************************************************************************
 * Copyright (c) 2020-2022 Sadret
 *
 * The OpenRCT2 plugin library "Persistence" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { FileSystem, FileSystemWatcher } from "./FileSystem";

// name encoding
// forbidden chars: . (dot), / (forward slash, keep for compatibility)
// escape char: \ (backslash)

function escape(char: string): string {
    return "\\" + char;
}

function replaceAll(text: string, search: string, replacement: string): string {
    return text.split(search).join(replacement);
}

function encode(text: string): string {
    if (text === "")
        return escape("");
    text = replaceAll(text, escape(""), escape(escape("")));
    text = replaceAll(text, ".", escape("d"));
    text = replaceAll(text, "/", escape("s"));
    return text;
}

function decode(text: string): string {
    if (text === escape(""))
        return "";
    text = replaceAll(text, escape("s"), "/");
    text = replaceAll(text, escape("d"), ".");
    text = replaceAll(text, escape(escape("")), escape(""));
    return text;
}

// storage helper functions

function has(key: string): boolean {
    return context.sharedStorage.has(key);
}

function get<S>(key: string): S | undefined {
    return context.sharedStorage.get(key);
}

function set<S>(key: string, value: S): void {
    context.sharedStorage.set(key, value);
}

interface StorageFolder<T> {
    type: "folder";
    files: { [key: string]: StorageElement<T> };
}

interface StorageFile<T> {
    type: "file";
    content: T;
}

type StorageElement<T> = StorageFolder<T> | StorageFile<T>;

/**
    Implements a file system that stores the files in the shared plugin storage.
    Each file system is identified by its namespace, which must be a valid
    identifier using JS dot notation, e.g. "my-plugin.data".
*/
export class JsonFileSystem<T> implements FileSystem<T> {
    private readonly namespace: string;

    /** Construct a new JsonFileSystem with a given namespace. */
    public constructor(namespace: string) {
        this.namespace = namespace;
    }

    // CONFIG HELPER METHODS

    private getKey(file: string): string {
        return this.namespace + file.replace(/\./g, ".files.");
    }

    private getElement<S extends StorageElement<T>>(file: string): S | undefined {
        return get<S>(this.getKey(file));
    }

    private setElement<S extends StorageElement<T> | undefined>(file: string, element: S): void {
        set<S>(this.getKey(file), element);
        this.watchers.forEach(watcher => watcher(file));
    }

    // GENERAL FILE SYSTEM METHODS

    public getRoot(): string {
        this.createFolder("");
        return "";
    }

    private readonly watchers: FileSystemWatcher[] = [];
    public watch(watcher: FileSystemWatcher): () => void {
        this.watchers.push(watcher);
        return () => {
            const idx = this.watchers.indexOf(watcher);
            if (idx !== -1)
                this.watchers.splice(idx, 1);
        };
    }

    /** Deletes all files and folders of the file system. */
    public purge(): void {
        set(this.namespace, undefined);
        this.getRoot();
    }


    // FILE & FOLDER INFORMATION

    public getName(file: string): string {
        return decode(file.slice(file.lastIndexOf(".") + 1));
    }

    public getParent(file: string): string | undefined {
        const idx = file.lastIndexOf(".");
        return idx < 0 ? undefined : file.slice(0, idx);
    }

    public exists(file: string): boolean {
        return has(this.getKey(file));
    };

    public isFolder(file: string): boolean {
        if (!this.exists(file))
            return false;
        const element = this.getElement<StorageElement<T>>(file);
        return element !== undefined && element.type === "folder";
    };

    public isFile(file: string): boolean {
        if (!this.exists(file))
            return false;
        const element = this.getElement<StorageElement<T>>(file);
        return element !== undefined && element.type === "file";
    };

    public getFiles(file: string): string[] {
        if (!this.isFolder(file))
            return [];

        const element = this.getElement<StorageFolder<T>>(file);
        if (element === undefined)
            return [];

        const result = [] as string[];
        for (const name in element.files)
            result.push(file + "." + name);
        return result;
    };

    public getData(file: string): T | undefined {
        if (!this.isFile(file))
            return undefined;

        const element = this.getElement<StorageFile<T>>(file);
        return element && element.content;
    };


    // FILE & FOLDER CREATION AND DELETION

    public getPath(parent: string, name: string): string {
        return parent + "." + encode(name);
    }

    public createFolder(file: string): boolean {
        if (this.exists(file))
            return false;

        const parent = this.getParent(file);
        parent && this.createFolder(parent);

        this.setElement<StorageFolder<T>>(file, {
            type: "folder",
            files: {},
        });
        return true;
    };

    public createFile(file: string, content: T): boolean {
        if (this.exists(file))
            return false;

        const parent = this.getParent(file);
        parent && this.createFolder(parent);

        this.setElement<StorageFile<T>>(file, {
            type: "file",
            content: content,
        });
        return true;
    };

    public delete(file: string): boolean {
        if (!this.exists(file))
            return false;

        this.setElement(file, undefined);
        return true;
    };


    // FILE & FOLDER MODIFICATION

    public copy(src: string, dst: string): boolean {
        if (!this.exists(src) || this.exists(dst))
            return false;

        const element = this.getElement<StorageElement<T>>(src);
        if (!element)
            return false;

        this.setElement(dst, this.deepCopy(element));
        return true;
    };

    public move(src: string, dst: string): boolean {
        if (this.isFolder(src) && dst.indexOf(src) !== -1)
            return false;
        return this.copy(src, dst) && this.delete(src);
    };

    public rename(file: string, name: string): boolean {
        const parent = this.getParent(file);
        return parent !== undefined && this.move(file, this.getPath(parent, name));
    }

    public setData(file: string, content: T): boolean {
        if (!this.isFile(file))
            return false;

        this.setElement<StorageFile<T>>(file, {
            type: "file",
            content: content,
        });
        return true;
    };

    private deepCopy<T>(element: StorageElement<T>): StorageElement<T> {
        if (element.type === "file") {
            const file = <StorageFile<T>>element;
            return {
                type: "file",
                content: file.content,
            };
        } else {
            const folder = <StorageFolder<T>>element;
            const files = {} as { [key: string]: StorageElement<T> };
            Object.keys(folder.files).forEach(key => {
                files[key] = this.deepCopy(folder.files[key]);
            });
            return <StorageElement<T>>{
                type: "folder",
                files: files,
            };
        }
    }
}
