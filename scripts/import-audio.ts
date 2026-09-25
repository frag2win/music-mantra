import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = 'C:\\Users\\Win10\\Downloads\\MHD-20260925T100449Z-1-001\\MHD';
const projectRoot = path.resolve(__dirname, '..');
const publicMantras = path.join(projectRoot, 'public', 'mantras');

const scaleMap: Record<string, string> = {
  'Safed_1_C': 'C',
  'Kali_1_C_Sharp': 'Csharp',
  'Safed_2_D': 'D',
  'Kali_2_D_Sharp': 'Dsharp',
  'Safed_3_E': 'E',
  'Safed_4_F': 'F',
  'Kali_3_F_Sharp': 'Fsharp',
  'Safed_5_G': 'G',
  'Kali_4_G_Sharp': 'Gsharp',
  'Safed_6_A': 'A',
  'Kali_5_A_Sharp': 'Asharp',
  'Safed_7_B': 'B'
};

const swarMap: Record<string, string> = {
  'Ga': 'diabetes',
  'Ma': 'hypertension',
  'Pa': 'thyroid'
};

async function main() {
  console.log(`Starting audio import from: ${sourceDir}`);
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }

  const rawAudioDir = path.join(publicMantras, 'audio');
  fs.mkdirSync(rawAudioDir, { recursive: true });

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.mpeg') || f.endsWith('.m4a') || f.endsWith('.mp3'));
  console.log(`Found ${files.length} audio files in source.`);

  let successCount = 0;

  for (const file of files) {
    const srcPath = path.join(sourceDir, file);
    // 1. Copy original file to public/mantras/audio/
    const rawDest = path.join(rawAudioDir, file);
    fs.copyFileSync(srcPath, rawDest);

    // 2. Parse filename (e.g. Kali_1_C_Sharp_Ga.mpeg)
    const baseName = path.parse(file).name;
    const parts = baseName.split('_');
    const swar = parts[parts.length - 1]; // Ga, Ma, or Pa
    const scaleKey = parts.slice(0, parts.length - 1).join('_'); // Kali_1_C_Sharp

    const condition = swarMap[swar];
    const noteSlug = scaleMap[scaleKey];

    if (!condition || !noteSlug) {
      console.warn(`⚠️ Could not parse: ${file} (swar=${swar}, scaleKey=${scaleKey})`);
      continue;
    }

    const conditionDir = path.join(publicMantras, condition);
    fs.mkdirSync(conditionDir, { recursive: true });

    // Copy to condition folders with canonical names for both registers (.mpeg, .mp3 and .m4a)
    for (const reg of ['low', 'high']) {
      const destMpeg = path.join(conditionDir, `${noteSlug}-${reg}.mpeg`);
      const destMp3 = path.join(conditionDir, `${noteSlug}-${reg}.mp3`);
      const destM4a = path.join(conditionDir, `${noteSlug}-${reg}.m4a`);
      fs.copyFileSync(srcPath, destMpeg);
      fs.copyFileSync(srcPath, destMp3);
      fs.copyFileSync(srcPath, destM4a);
    }

    console.log(`✓ Mapped: ${file} -> ${condition}/${noteSlug} (low & high)`);
    successCount++;
  }

  console.log(`\n🎉 Successfully imported and organized ${successCount} audio files into public/mantras/!`);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
