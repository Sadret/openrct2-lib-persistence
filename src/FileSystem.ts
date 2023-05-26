/*****************************************************************************
 * Copyright (c) 2023 Sadret
 *
 * The OpenRCT2 plugin library "Persistence" is licensed
 * under the GNU General License version 3.
 *****************************************************************************/

/** A callback function for changes in a file system. */
export type FileSystemWatcher = (path: string) => void;

/**
    A file system that allows creation, modification and deletion of files and folders.
    Files and folders are represented by paths.
    Paths are not meant to be created manually, but to be obtained by the getPath method.
    The generic parameter <T> represents the data format of files.
*/
export interface FileSystem<T> {

    // GENERAL FILE SYSTEM METHODS

    /** Gets the root path of the file system. */
    getRoot(): string;

    /**
        Adds a file system watcher to the file system.
        Each watcher gets notified by any change to the files and folders made by *this file system*.
        Changes to the data or file structure made by external forces may or may not be reported.
        Returns a callback to unwatch.
    */
    watch(watcher: FileSystemWatcher): () => void;


    // FILE & FOLDER INFORMATION

    /** Gets the name of the file or folder at a path. */
    getName(path: string): string;

    /** Gets the parent path of a path. Returns undefined if the path is the root path. */
    getParent(path: string): string | undefined;

    /** Checks if the file or folder at a path exists. */
    exists(path: string): boolean;

    /** Checks if the path represents a folder. */
    isFolder(path: string): boolean;

    /** Checks if the path represents a file. */
    isFile(path: string): boolean;

    /** Gets contained files if path represents a folder and undefined otherwise. */
    getFiles(path: string): string[] | undefined;

    /** Gets data of file if path represent a file and undefined otherwise. */
    getData(path: string): T | undefined;


    // FILE & FOLDER CREATION AND DELETION

    /** Gets the path of a file or folder with a given parent and name. */
    getPath(parent: string, name: string): string;

    /** Creates a folder at a path. */
    createFolder(path: string): boolean;

    /** Creates a file with given data at a path. */
    createFile(path: string, data: T): boolean;

    /** Deletes the file or folder at a path. */
    delete(path: string): boolean;


    // FILE & FOLDER MODIFICATION
    // (These methods are not strictly necessary, but usually the
    // FileSystem has a more efficient way of implementing them.)

    /**
        Copies a file or folder from a source path to a destination path.
        Returns if the operation succeeded.
    */
    copy(src: string, dst: string): boolean;

    /**
        Moves a file or folder from a source path to a destination path.
        Returns if the operation succeeded.
    */
    move(src: string, dst: string): boolean;

    /**
        Renames a file or folder at a path.
        Returns if the operation succeeded.
    */
    rename(path: string, name: string): boolean;

    /**
        Sets the data of a file, if the  at a path.
        Returns if the operation succeeded.
    */
    setData(path: string, data: T): boolean;
}
