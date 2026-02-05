const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Read from .env.local
require('dotenv').config({ path: '.env.local' });

const YOUR_EMAIL = process.argv[2];

if (!YOUR_EMAIL) {
  console.error('Usage: node scripts/add-admin.js <your-email>');
  console.error('Example: node scripts/add-admin.js giles@awe2m8.com');
  process.exit(1);
}

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

// Handle escaped newlines
if (privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

// Remove surrounding quotes if present
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const db = getFirestore(app);

async function addAdmin() {
  const normalizedEmail = YOUR_EMAIL.toLowerCase().trim();
  
  const userData = {
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0],
    role: 'admin',
    createdAt: Date.now(),
  };

  await db.collection('admin_users').doc(normalizedEmail).set(userData);
  
  console.log(`✅ Added ${normalizedEmail} as admin user`);
  console.log('You can now log in with Google Auth at http://localhost:3000/login');
  
  process.exit(0);
}

addAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
