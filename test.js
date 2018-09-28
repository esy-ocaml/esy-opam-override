const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { execSync } = require("child_process");

const getAllPackages = () => {
    const packageDir = path.join(__dirname, "packages");   

    const getDirectories = (root) => fs.readdirSync(root);

    // Assumes everything in 'packages' is a directory
    return getDirectories(packageDir);
};

const getFilesInChange = () => {
    return execSync("git diff --name-only 6 HEAD", {cwd: __dirname}).toString("utf8");
};

const getRelevantPackagesToTest = () => {
    const allPackages = getAllPackages();
    const changes = getFilesInChange();

    return allPackages.filter((p) => changes.indexOf(p) >= 0);
}

const mkdirTemp = (packageFolder) => {
    const p = path.join(os.tmpdir(), packageFolder + crypto.randomBytes(4).toString("hex")); 
    fs.mkdirSync(p);
    return p;
}

const getNameAndVersionForPackage = (packageFolder) => {
    let firstPeriod = packageFolder.indexOf(".");
    let name = packageFolder.substring(0, firstPeriod);
    let version = packageFolder.substring(firstPeriod+1, packageFolder.length);

    return {name, version};
};

const prefixPath = mkdirTemp("ESY__PREFIX");
const cachePath = mkdirTemp("ESYI__CACHE");

const testPackage = (packageFolder) => {
    const pkgInfo = getNameAndVersionForPackage(packageFolder);
    console.log(`** TESTING PACKAGE: ${pkgInfo.name}@${pkgInfo.version}`);

    const testFolder = mkdirTemp(packageFolder);    
    console.log("   - Package build folder: " + testFolder);
    console.log("   - Prefix path: " + prefixPath);
    console.log("   - Cache path: " + cachePath);

    const esy = (command) => {
        return execSync(`esy ${command}`, {
            cwd: testFolder,
            env: {
                ...process.env,
                ESY__PREFIX: prefixPath,
                ESYI__OPAM_OVERRIDE: __dirname,
                ESYI__CACHE: cachePath,
            }
        });
    };

    fs.writeFileSync(
        path.join(testFolder, "package.json"),
        JSON.stringify({
            name: "test-project",
            version: "1.0.0",
            esy: {
                build: ["echo done!"]
            },
            dependencies: {
                [`@opam/${pkgInfo.name}`]: `${pkgInfo.version}`
            },
            devDependencies: {
                "ocaml": "~4.6.0",
            }
        })
    );

    esy("install");
    esy("build");
};

const packagesToTest = getRelevantPackagesToTest();

console.log(`** Detected ${packagesToTest.length} package to verify...`);

packagesToTest.forEach((p) => testPackage(p));

console.log("** Test run completed!");
