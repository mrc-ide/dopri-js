# Publishing

Steps to update the package on npm

```
git fetch
npm run build
npx npm-packlist
git tag "v$(npm show . version)"
npm publish
git push --tags
```

New version will appear at https://www.npmjs.com/package/dopri
