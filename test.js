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
    return execSync("git diff --name-only origin/6 HEAD", {cwd: __dirname}).toString("utf8");
};

const getCurrentCommit = () => {
    return execSync("git rev-parse HEAD", {cwd: __dirname}).toString("utf8").trim();
};

const getRelevantPackagesToTest = () => {
    const allPackages = getAllPackages();
    const changes = getFilesInChange();

    return allPackages.filter((p) => changes.indexOf(p) >= 0);
}

const mkdirTemp = (packageFolder) => {
    // For AppVeyor, use a root-level folder - the permissions
    // in the temp folder are problematic
    const tempFolder = os.platform() === "win32" ? "C:/esy-temp" : os.tmpdir();
    if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder);
    }

    const p = path.join(tempFolder, packageFolder + crypto.randomBytes(4).toString("hex")); 
    fs.mkdirSync(p);
    return p;
}

const getNameAndVersionForPackage = (packageFolder) => {
    let firstPeriod = packageFolder.indexOf(".");
    if (firstPeriod === -1) {
        return {name: packageFolder, version: '*'};
    } else {
        let name = packageFolder.substring(0, firstPeriod);
        let version = packageFolder.substring(firstPeriod+1, packageFolder.length);

        return {name, version};
    }
};

const prefixPath = mkdirTemp("ESY__PREFIX");
const cachePath = mkdirTemp("ESYI__CACHE");

// Currently, the esyi override is hardcoded to use the "6"
// branch. We should make that overridable, but in the meantime,
// we'll create a second repo that has the branch setup.
const createOverrideRepository = () => {
    const overridePath = mkdirTemp("OPAM_OVERRIDE");
    const currentCommit = getCurrentCommit();
    // Create a clone in the override path...
    execSync(`git clone ${__dirname} ${overridePath}`);
    // And force the '6' branch to point to the current commit
    execSync("git checkout -b 6", {cwd: overridePath});
    execSync(`git reset --hard ${currentCommit}`, {cwd: overridePath});
    return overridePath;
};

const testPackage = (packageFolder) => {
    const pkgInfo = getNameAndVersionForPackage(packageFolder);
    console.log(`** TESTING PACKAGE: ${pkgInfo.name}@${pkgInfo.version} from folder:${packageFolder}`);

    const testFolder = mkdirTemp(packageFolder);    
    const overridePath = createOverrideRepository();
    console.log("   - Package build folder: " + testFolder);
    console.log("   - Override repo: " + overridePath);
    console.log("   - Prefix path: " + prefixPath);
    console.log("   - Cache path: " + cachePath);

    const esy = (command) => {
        return execSync(`esy ${command}`, {
            cwd: testFolder,
            env: {
                ...process.env,
                ESY__PREFIX: prefixPath,
                ESYI__OPAM_OVERRIDE: ":" + overridePath,
                ESYI__CACHE: cachePath,
            },
            stdio: [0, 1, 2]
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
                "ocaml": "~4.9.0",
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
