import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_LOGO = path.join(__dirname, '../src/assets/Logo_Gesclic.png');
const OUTPUT_DIR = path.join(__dirname, '../public');

const ICON_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA à partir du logo...');
  
  try {
    // Vérifier que le logo existe
    if (!fs.existsSync(SOURCE_LOGO)) {
      throw new Error(`Logo source non trouvé: ${SOURCE_LOGO}`);
    }

    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Générer chaque taille d'icône
    for (const { name, size } of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);
      
      console.log(`✅ ${name} (${size}x${size})`);
    }

    // Générer favicon.ico (contient 16x16 et 32x32)
    const faviconPath = path.join(OUTPUT_DIR, 'favicon.ico');
    const sizes = [16, 32];
    const images = await Promise.all(
      sizes.map(size =>
        sharp(SOURCE_LOGO)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 15, g: 23, b: 42, alpha: 1 }
          })
          .png()
          .toBuffer()
      )
    );
    
    // Pour favicon.ico, on utilise sharp avec le format ico
    await sharp(images[1])
      .toFile(faviconPath);
    
    console.log(`✅ favicon.ico`);

    // Générer mask-icon (SVG avec transparence)
    const maskIconPath = path.join(OUTPUT_DIR, 'mask-icon.svg');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="128" fill="#0f172a"/>
      <image href="data:image/png;base64,${images[1].toString('base64')}" x="128" y="128" width="256" height="256"/>
    </svg>`;
    fs.writeFileSync(maskIconPath, svgContent);
    console.log(`✅ mask-icon.svg`);

    console.log('\n🎉 Toutes les icônes PWA ont été générées avec succès!');
    console.log(`📁 Répertoire de sortie: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error);
    process.exit(1);
  }
}

generateIcons();
