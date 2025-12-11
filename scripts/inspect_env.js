const fs = require('fs');
const path = require('path');

const files = ['.env.local', '.env'];

files.forEach(file => {
    const envPath = path.resolve(__dirname, '../' + file);
    console.log(`Checking ${envPath}...`);

    if (fs.existsSync(envPath)) {
        console.log(`File exists. Size: ${fs.statSync(envPath).size} bytes`);
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (!line.trim()) return;
            console.log(`Line ${i + 1}: ${line.substring(0, 10)}... (Length: ${line.length})`);
        });
    } else {
        console.log('File does not exist.');
    }
    console.log('---');
});
