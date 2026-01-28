# Mono

## Development

### Build

```bash
yarn build
```

### Debug

```bash
# From consumer repo
yarn node inspect --inspect-port=0 ./node_modules/mono/bin/mono projects check
```

Can use `debugger` statement in code.
