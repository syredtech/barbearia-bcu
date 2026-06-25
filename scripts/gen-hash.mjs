import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Uso: node scripts/gen-hash.mjs <password>");
  console.error("Mínimo 10 caracteres.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log(hash);
