import fetch from 'node-fetch';

if (!process.env.FPT_API_KEY) {
  throw new Error("FPT_API_KEY environment variable must be set");
}

export interface FPTVoice {
  voice: string;
  name: string;
  gender: string;
  region: string;
  description: string;
}

export const FPT_VOICES: FPTVoice[] = [
  {
    voice: 'banmai',
    name: 'Ban Mai',
    gender: 'female',
    region: 'north',
    description: 'Giọng nữ miền Bắc, tự nhiên'
  },
  {
    voice: 'leminh',
    name: 'Lê Minh',
    gender: 'male',
    region: 'north',
    description: 'Giọng nam miền Bắc, mạnh mẽ'
  },
  {
    voice: 'thuminh',
    name: 'Thu Minh',
    gender: 'female',
    region: 'south',
    description: 'Giọng nữ miền Nam, dịu dàng'
  },
  {
    voice: 'giahuy',
    name: 'Gia Huy',
    gender: 'male',
    region: 'south',
    description: 'Giọng nam miền Nam, trầm ấm'
  },
  {
    voice: 'ngoclam',
    name: 'Ngọc Lam',
    gender: 'female',
    region: 'central',
    description: 'Giọng nữ miền Trung, thanh thoát'
  }
];

export interface FPTTTSRequest {
  text: string;
  voice: string;
  speed?: number; // 0.5 - 2.0, default 1.0
  format?: 'wav' | 'mp3'; // default 'wav'
}

export interface FPTTTSResponse {
  async: string;
  error?: number;
  message?: string;
}

export interface FPTTTSResult {
  finished: boolean;
  request_id: string;
  url?: string;
  error?: number;
  message?: string;
}

class FPTAIService {
  private readonly baseUrl = 'https://api.fpt.ai/hmi/tts/v5';
  private readonly apiKey = process.env.FPT_API_KEY!;

  async synthesizeText(request: FPTTTSRequest): Promise<Buffer> {
    try {
      console.log('FPT API Request:', {
        text: request.text,
        voice: request.voice,
        speed: request.speed || 1.0,
        format: request.format || 'wav'
      });

      // Step 1: Request synthesis
      const synthesisResponse = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'speed': (request.speed || 1.0).toString(),
          'voice': request.voice,
          'format': request.format || 'wav'
        },
        body: request.text
      });

      console.log('FPT API Response Status:', synthesisResponse.status);
      const responseText = await synthesisResponse.text();
      console.log('FPT API Response Text:', responseText);

      if (!synthesisResponse.ok) {
        throw new Error(`FPT AI synthesis failed: ${synthesisResponse.status} - ${responseText}`);
      }

      let synthesisResult: FPTTTSResponse;
      try {
        synthesisResult = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (synthesisResult.error) {
        throw new Error(`FPT AI error: ${synthesisResult.message}`);
      }

      if (!synthesisResult.async) {
        throw new Error('No async URL in response');
      }

      console.log('FPT API Synthesis Result:', synthesisResult);

      // Step 2: Download audio directly from async URL with retry
      let retryCount = 0;
      const maxRetries = 12; // Increased retries
      const baseDelay = 2000; // 2 seconds base delay

      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 FPT Audio download attempt ${retryCount + 1}/${maxRetries}`);
          const audioResponse = await fetch(synthesisResult.async);
          
          if (audioResponse.ok) {
            const contentType = audioResponse.headers.get('content-type');
            console.log(`📦 Response content-type: ${contentType}, status: ${audioResponse.status}`);
            
            if (contentType?.includes('audio') || contentType?.includes('mpeg') || contentType?.includes('mp3')) {
              const audioArrayBuffer = await audioResponse.arrayBuffer();
              const audioBuffer = Buffer.from(audioArrayBuffer);
              
              if (audioBuffer.byteLength > 1000) { // Ensure meaningful audio data
                console.log(`✅ Audio ready! Buffer size: ${audioBuffer.byteLength} bytes`);
            return audioBuffer;
              } else {
                console.log(`⚠️ Audio buffer too small: ${audioBuffer.byteLength} bytes, retrying...`);
              }
            } else {
              console.log(`⏳ Audio not ready yet (content-type: ${contentType}), retrying...`);
            }
          } else {
            console.log(`❌ Response not OK: ${audioResponse.status} ${audioResponse.statusText}`);
          }
          
          // Dynamic delay based on attempt
          const delay = Math.min(baseDelay * Math.pow(1.3, retryCount), 10000); // Cap at 10s
          console.log(`⏱️ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } catch (error) {
          console.error(`💥 Error downloading audio (attempt ${retryCount + 1}):`, error);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(`FPT AI failed after ${maxRetries} retries: ${error}`);
          }
          const delay = Math.min(baseDelay * Math.pow(1.3, retryCount), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw new Error(`Failed to download audio after ${maxRetries} retries`);

    } catch (error) {
      console.error('FPT AI synthesis error:', error);
      throw error;
    }
  }

  getAvailableVoices(): FPTVoice[] {
    return FPT_VOICES;
  }

  isValidVoice(voice: string): boolean {
    return FPT_VOICES.some(v => v.voice === voice);
  }
}

export const fptAI = new FPTAIService();