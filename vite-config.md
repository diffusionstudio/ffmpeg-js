Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp

## Vite

```
export default {
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
    },
};
```

