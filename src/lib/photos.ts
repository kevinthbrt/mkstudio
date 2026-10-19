import fs from "fs";
import path from "path";

/** Extensions acceptées, par ordre de préférence. */
const EXTENSIONS = ["webp", "jpg", "jpeg", "png", "avif"];

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

/**
 * Cherche une photo dans public/photos/ à partir de son nom sans extension.
 * Renvoie le chemin public utilisable par <Image />, ou null si le fichier
 * n'a pas encore été déposé : dans ce cas la landing affiche un emplacement
 * réservé avec le nom de fichier attendu.
 */
export function findPhoto(name: string): string | null {
  for (const extension of EXTENSIONS) {
    const fileName = `${name}.${extension}`;
    try {
      if (fs.existsSync(path.join(PHOTOS_DIR, fileName))) {
        return `/photos/${fileName}`;
      }
    } catch {
      // Dossier absent ou illisible : on retombe sur l'emplacement réservé.
    }
  }
  return null;
}
