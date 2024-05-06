# Data

## EquivalentKeyMap

`equivalent-key-map` is a library used by `@wordpress/data` to support selector return value memoization using deep equality of selector arguments.

While it does support deep equality, it performs a check for true object equality before starting the lookup. Keeping a reference to selector arguments, when their value has not changed, should drastically improve the lookup of cached selector values.

> It also optimizes for repeated calls with the same object reference, memoizing the latest invocation of get to shortcut lookups.

[Reference](https://github.com/aduth/equivalent-key-map#performance-considerations)
