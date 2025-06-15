import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sampleText = "Xin chào, đây là giọng đọc mẫu của VoiceText Pro. Bạn có thể sử dụng công cụ này để chuyển đổi văn bản thành giọng nói chất lượng cao.";

const voices = [
  { id: "vi-VN-HoaiMy", name: "Hoài My", openaiVoice: "alloy" },
  { id: "vi-VN-NamMinh", name: "Nam Minh", openaiVoice: "echo" },
  { id: "vi-VN-ThuHa", name: "Thu Hà", openaiVoice: "nova" },
  { id: "vi-VN-QuangAnh", name: "Quang Anh", openaiVoice: "onyx" },
  { id: "vi-VN-HongLan", name: "Hồng Lan", openaiVoice: "shimmer" },
  { id: "vi-VN-TuanVu", name: "Tuấn Vũ", openaiVoice: "fable" }
];

async function generateVoiceSample(voice) {
  try {
    console.log(`Đang tạo mẫu cho giọng ${voice.name}...`);
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice.openaiVoice,
      input: sampleText,
      response_format: "mp3"
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join("public", "audio-samples", `${voice.id}.mp3`);
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Đã tạo: ${outputPath}`);
    
  } catch (error) {
    console.error(`✗ Lỗi tạo mẫu cho ${voice.name}:`, error.message);
  }
}

async function main() {
  console.log("Bắt đầu tạo các file audio mẫu...");
  
  // Tạo thư mục nếu chưa có
  const samplesDir = path.join("public", "audio-samples");
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  // Tạo từng file mẫu
  for (const voice of voices) {
    await generateVoiceSample(voice);
    // Delay để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("Hoàn thành tạo tất cả file audio mẫu!");
}

main().catch(console.error);