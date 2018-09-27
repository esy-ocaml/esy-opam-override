const path = require("path");
const fs = require("fs");
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

console.log("Hello world");

console.dir(getRelevantPackagesToTest());

console.dir(getFilesInChange());
