FROM node:22-alpine AS runtime

WORKDIR /app

# Expect the build pipeline to have already run `pnpm build` and produced dist/.
COPY dist ./dist
COPY package.json ./

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
