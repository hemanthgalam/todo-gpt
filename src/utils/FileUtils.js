const fs = require('fs-extra');
const path = require('path');

class FileUtils {
    static async ensureDirectoryExists(dirPath) {
        await fs.ensureDir(dirPath);
    }

    static async readJsonFile(filePath, defaultValue = {}) {
        try {
            if (await fs.pathExists(filePath)) {
                return await fs.readJson(filePath);
            }
            return defaultValue;
        } catch (error) {
            console.error(`Error reading JSON file ${filePath}:`, error);
            return defaultValue;
        }
    }

    static async writeJsonFile(filePath, data) {
        try {
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeJson(filePath, data, { spaces: 2 });
        } catch (error) {
            console.error(`Error writing JSON file ${filePath}:`, error);
            throw error;
        }
    }

    static async copyDirectory(src, dest, options = {}) {
        try {
            await fs.copy(src, dest, {
                filter: options.filter || (() => true),
                overwrite: options.overwrite !== false
            });
        } catch (error) {
            console.error(`Error copying directory from ${src} to ${dest}:`, error);
            throw error;
        }
    }

    static async getFileStats(filePath) {
        try {
            if (await fs.pathExists(filePath)) {
                return await fs.stat(filePath);
            }
            return null;
        } catch (error) {
            console.error(`Error getting file stats for ${filePath}:`, error);
            return null;
        }
    }

    static async findFiles(directory, pattern, maxDepth = 10) {
        const files = [];
        
        async function search(dir, depth) {
            if (depth > maxDepth) return;
            
            try {
                const items = await fs.readdir(dir);
                
                for (const item of items) {
                    if (item.startsWith('.')) continue;
                    
                    const itemPath = path.join(dir, item);
                    const stats = await fs.stat(itemPath);
                    
                    if (stats.isDirectory()) {
                        await search(itemPath, depth + 1);
                    } else if (pattern.test(item)) {
                        files.push(itemPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }
        
        await search(directory, 0);
        return files;
    }

    static getRelativePath(from, to) {
        return path.relative(from, to);
    }

    static joinPath(...paths) {
        return path.join(...paths);
    }

    static getExtension(filePath) {
        return path.extname(filePath);
    }

    static getBasename(filePath, ext) {
        return path.basename(filePath, ext);
    }

    static getDirname(filePath) {
        return path.dirname(filePath);
    }
}

module.exports = FileUtils;