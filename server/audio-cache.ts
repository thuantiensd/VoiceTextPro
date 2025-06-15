import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'audio-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export class AudioCache {
  private static generateCacheKey(audioFileId: number, content: string, voice: string, speed: number): string {
    const hash = crypto.createHash('md5')
      .update(`${audioFileId}-${content}-${voice}-${speed}`)
      .digest('hex');
    return `audio-${audioFileId}-${hash}.mp3`;
  }

  static async get(audioFileId: number, content: string, voice: string, speed: number): Promise<Buffer | null> {
    try {
      const cacheKey = this.generateCacheKey(audioFileId, content, voice, speed);
      const cachePath = path.join(CACHE_DIR, cacheKey);
      
      if (fs.existsSync(cachePath)) {
        console.log(`✅ Audio cache hit for file ${audioFileId}`);
        return fs.readFileSync(cachePath);
      }
      
      console.log(`❌ Audio cache miss for file ${audioFileId}`);
      return null;
    } catch (error) {
      console.error('Audio cache get error:', error);
      return null;
    }
  }

  static async set(audioFileId: number, content: string, voice: string, speed: number, audioBuffer: Buffer): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(audioFileId, content, voice, speed);
      const cachePath = path.join(CACHE_DIR, cacheKey);
      
      fs.writeFileSync(cachePath, audioBuffer);
      console.log(`💾 Audio cached for file ${audioFileId}`);
    } catch (error) {
      console.error('Audio cache set error:', error);
    }
  }

  static async clear(audioFileId?: number): Promise<void> {
    try {
      if (audioFileId) {
        // Clear specific file cache
        const files = fs.readdirSync(CACHE_DIR);
        const filesToDelete = files.filter(file => file.startsWith(`audio-${audioFileId}-`));
        
        for (const file of filesToDelete) {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        }
        console.log(`🗑️ Cleared cache for audio file ${audioFileId}`);
      } else {
        // Clear all cache
        const files = fs.readdirSync(CACHE_DIR);
        for (const file of files) {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        }
        console.log('🗑️ Cleared all audio cache');
      }
    } catch (error) {
      console.error('Audio cache clear error:', error);
    }
  }

  static getCacheStats(): { totalFiles: number, totalSize: number } {
    try {
      const files = fs.readdirSync(CACHE_DIR);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
      
      return {
        totalFiles: files.length,
        totalSize
      };
    } catch (error) {
      console.error('Audio cache stats error:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
} 