# esy-opam-override

Esy allows to use any opam package published in opam repository by automatically
converting from `opam` format to `package.json` format. Unfortunately this
automatic conversion doesn't work in 100% of cases. This is why we maintain a
collection of "fixups" for opam packages.

## Repository structure

```
packages
├── ...
└── PACKAGE_NAME.PACKAGE_VERSION_PATTERN
    ├── ...
    └── ocaml_VERSION_CONSTRAINT
        └── package.json
```

## How to contribute

TODO

## Esy override specification

```
TODO
```
