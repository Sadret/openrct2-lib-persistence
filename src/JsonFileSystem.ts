/*****************************************************************************
 * Copyright (c) 2023 Sadret
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

/** Implements a file system that stores the data in the shared plugin storage. */
export class JsonFileSystem<T> implements FileSystem<T> {
    private readonly namespace: string;

    /**
        Constructs a new JsonFileSystem with a given namespace.
        Each file system is identified by its namespace, which must be a valid
        identifier using JS dot notation, e.g. "my-plugin.data" or
        "my-plugin.data.saves", but not just "my-plugin".
        The namespace is the path in the plugin.store.json file under which the
        filesystem will be saved.
    */
    public constructor(namespace: string) {
        this.namespace = namespace;
    }

    // CONFIG HELPER METHODS

    private getKey(path: string): string {
        return this.namespace + path.replace(/\./g, ".files.");
    }

    private getElement<S extends StorageElement<T>>(path: string): S | undefined {
        return get<S>(this.getKey(path));
    }

    private setElement<S extends StorageElement<T> | undefined>(path: string, element: S): void {
        set<S>(this.getKey(path), element);
        this.watchers.forEach(watcher => watcher(path));
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


    // FILE & FOLDER INFORMATION

    public getName(path: string): string {
        return decode(path.slice(path.lastIndexOf(".") + 1));
    }

    public getParent(path: string): string | undefined {
        const idx = path.lastIndexOf(".");
        return idx < 0 ? undefined : path.slice(0, idx);
    }

    public getChild(parent: string, name: string): string {
        return parent + "." + encode(name);
    }

    public exists(path: string): boolean {
        return has(this.getKey(path));
    };

    public isFolder(path: string): boolean {
        if (!this.exists(path))
            return false;
        const element = this.getElement<StorageElement<T>>(path);
        return element !== undefined && element.type === "folder";
    };

    public isFile(path: string): boolean {
        if (!this.exists(path))
            return false;
        const element = this.getElement<StorageElement<T>>(path);
        return element !== undefined && element.type === "file";
    };

    public getChildren(path: string): string[] | undefined {
        if (!this.isFolder(path))
            return undefined;

        const element = this.getElement<StorageFolder<T>>(path);
        if (element === undefined)
            return undefined;

        const result = [] as string[];
        for (const name in element.files)
            result.push(path + "." + name);
        return result;
    };

    public getData(path: string): T | undefined {
        if (!this.isFile(path))
            return undefined;

        const element = this.getElement<StorageFile<T>>(path);
        return element && element.content;
    };


    // FILE & FOLDER CREATION AND DELETION

    public createFolder(path: string): boolean {
        if (this.exists(path))
            return false;

        const parent = this.getParent(path);
        parent && this.createFolder(parent);

        this.setElement<StorageFolder<T>>(path, {
            type: "folder",
            files: {},
        });
        return true;
    };

    public createFile(path: string, content: T): boolean {
        if (this.exists(path))
            return false;

        const parent = this.getParent(path);
        parent && this.createFolder(parent);

        this.setElement<StorageFile<T>>(path, {
            type: "file",
            content: content,
        });
        return true;
    };

    public delete(path: string): boolean {
        if (!this.exists(path))
            return false;

        this.setElement(path, undefined);
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

    public rename(path: string, name: string): boolean {
        const parent = this.getParent(path);
        return parent !== undefined && this.move(path, this.getChild(parent, name));
    }

    public setData(path: string, content: T): boolean {
        if (!this.isFile(path))
            return false;

        this.setElement<StorageFile<T>>(path, {
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
