# esy-opam-override

Esy allows to use any opam package published in opam repository by automatically
converting from `opam` format to `package.json` format.

Unfortunately this automatic conversion doesn't work in 100% of cases. This is
why we maintain a collection of "fixups" for opam packages.

## Repository structure

```
packages
├── ...
└── PACKAGE_NAME.PACKAGE_VERSION_PATTERN
    ├── ...
    └── ocaml_VERSION_CONSTRAINT
        ├── files (optional)
        └── package.json
```

## Esy override specification

Each `package.json` should contain a single JSON object which conforms to the
type `OpamOverride` described below:

```
type OpamOverride = {
  exportedEnv?: {[name: string]: EnvExport},
  dependencies?: {[name: string]: string},
  build?: string[],
  install?: string[],
  opam?: {
    url: string,
    checksum: md5checksum
  }
}

type md5checksum = string

type EnvExport = {
  val: string,
  scope?: 'global' | 'local'
}
```

All items within the `files` directory will be copied over to the package
installation root.

