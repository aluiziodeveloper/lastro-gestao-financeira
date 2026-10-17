# Estágio de construção: instala tudo, inclusive o TypeScript, e
# compila src/ para dist/. Nada dele vai para a imagem final, a não
# ser o que o COPY --from copiar.
FROM node:24.22.0-slim AS construcao
WORKDIR /lastro
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Estágio final: só as dependências de execução e o compilado, e o
# processo roda como o usuário node, e não como root.
FROM node:24.22.0-slim
ENV NODE_ENV=production
WORKDIR /lastro
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=construcao /lastro/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/adaptadores/http/servidor.js"]
