const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const JDK_URL = 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz';
const JDK_DIR = path.join(__dirname, '..', 'jdk');

if (process.platform === 'win32') {
    console.log('Skipping JDK download on Windows.');
    process.exit(0);
}

if (fs.existsSync(JDK_DIR)) {
    console.log('JDK already installed.');
    process.exit(0);
}

console.log('Downloading JDK...');
const tarballPath = path.join(__dirname, '..', 'jdk.tar.gz');

const file = fs.createWriteStream(tarballPath);

https.get(JDK_URL, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
            res.pipe(file);
            file.on('finish', extract);
        });
    } else {
        response.pipe(file);
        file.on('finish', extract);
    }
}).on('error', (err) => {
    fs.unlink(tarballPath, () => {});
    console.error('Error downloading JDK:', err.message);
});

function extract() {
    file.close();
    console.log('Extracting JDK...');
    try {
        fs.mkdirSync(JDK_DIR, { recursive: true });
        execSync(`tar -xzf ${tarballPath} -C ${JDK_DIR} --strip-components=1`);
        fs.unlinkSync(tarballPath);
        console.log('JDK installed successfully to', JDK_DIR);
    } catch (err) {
        console.error('Error extracting JDK:', err.message);
    }
}
